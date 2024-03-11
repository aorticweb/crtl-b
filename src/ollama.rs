use crate::{CTRLBackendError, ErrContent, Model};
use bytes::Bytes;
use futures_util::StreamExt;
use reqwest::{self, StatusCode};
use serde::{Deserialize, Serialize};

// const TIME_LIMIT: Duration = Duration::from_secs(30);

fn model_to_str(model: Model) -> String {
    match model {
        Model::Llama2 => "llama2".to_string(),
    }
}

#[derive(Debug, Serialize)]
struct Payload {
    model: String,
    prompt: String,
    keep_alive: String,
    stream: bool,
}

#[derive(Deserialize)]
struct Response {
    response: String,
}

impl TryFrom<String> for Response {
    type Error = CTRLBackendError;
    fn try_from(text: String) -> Result<Response, CTRLBackendError> {
        let ollama_response: serde_json::Result<Response> = serde_json::from_str(&text);
        if ollama_response.is_err() {
            return Err(CTRLBackendError::LLM(ErrContent::from_error(
                format!(
                    "Failed to parse ollama response text to expected json: text was {}",
                    text
                )
                .as_str(),
                ollama_response.err().unwrap(),
            )))?;
        }
        Ok(ollama_response.unwrap())
    }
}

impl TryFrom<Bytes> for Response {
    type Error = CTRLBackendError;
    fn try_from(bytes: Bytes) -> Result<Response, CTRLBackendError> {
        let ollama_response: serde_json::Result<Response> = serde_json::from_slice(&bytes);
        if ollama_response.is_err() {
            return Err(CTRLBackendError::LLM(ErrContent::from_error(
                format!("Failed to parse ollama response text to expected json from bytes",)
                    .as_str(),
                ollama_response.err().unwrap(),
            )))?;
        }
        Ok(ollama_response.unwrap())
    }
}

async fn text_or_null(resp: reqwest::Response) -> String {
    resp.text().await.unwrap_or_default()
}
async fn handle_error_status_code(resp: reqwest::Response) -> CTRLBackendError {
    match resp.status() {
        StatusCode::BAD_REQUEST => CTRLBackendError::LLM("Bad request".into()),
        StatusCode::NOT_FOUND => CTRLBackendError::LLMConnection("is ollama running?".into()),
        code => CTRLBackendError::Unexpected(ErrContent {
            details: "Unexpected ollama status code".to_string(),
            debug: Some(format!("{}: {}", code, text_or_null(resp).await)),
        }),
    }
}

fn extract_ollama_api_error(err: reqwest::Error) -> CTRLBackendError {
    if err.is_timeout() {
        return CTRLBackendError::LLMTimeoutError(ErrContent::from_error("Request timeout", err));
    }
    CTRLBackendError::LLM(ErrContent::from_error("Unexpected API call failure", err))
}

/// Send a request to the ollama backend
/// Validate (including status code) and return the response
async fn request(
    prompt: String,
    url: String,
    model: Model,
    stream: bool,
) -> Result<reqwest::Response, CTRLBackendError> {
    let client = reqwest::Client::new();
    let payload = Payload {
        model: model_to_str(model),
        prompt: prompt,
        keep_alive: "15m".to_string(),
        stream: stream,
    };
    let url = url.trim_end_matches('/');
    let resp = client
        .post(format!("{url}/api/generate"))
        .json(&payload)
        // timeout is pending
        // https://github.com/seanmonstar/reqwest/pull/1760
        // .timeout(TIME_LIMIT)
        .send()
        .await
        .map_err(extract_ollama_api_error)?;
    if !resp.status().is_success() {
        return Err(handle_error_status_code(resp).await);
    }
    return Ok(resp);
}

pub async fn stream(
    prompt: String,
    url: String,
    model: Model,
    callback: impl Fn(String),
) -> Result<(), CTRLBackendError> {
    let resp = request(prompt, url, model, true).await?;
    let mut stream = resp.bytes_stream();
    let mut full_response = "".to_string();
    while let Some(item) = stream.next().await {
        match item {
            Ok(bytes) => {
                let response: Response = bytes.try_into()?;
                full_response.push_str(&response.response);
                // TODO:
                // Think about not cloning here
                callback(full_response.clone());
            }
            Err(err) => {
                return Err(CTRLBackendError::LLM(ErrContent::from_error(
                    "Failed to get bytes from ollama response",
                    err,
                )))?;
            }
        }
    }
    Ok(())
}
