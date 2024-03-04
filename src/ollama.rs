use crate::{CTRLBackendError, ErrContent};
use crate::{Model, Task};
use reqwest::{self, StatusCode};
use serde::{Deserialize, Serialize};
// use serde_json;

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

async fn text_or_null(resp: reqwest::Response) -> String {
    resp.text().await.unwrap_or_default()
}
async fn handle_error_status_code(resp: reqwest::Response) -> CTRLBackendError {
    match resp.status() {
        StatusCode::BAD_REQUEST => CTRLBackendError::LLM("Bad request".into()),
        StatusCode::NOT_FOUND => CTRLBackendError::LLMConnection("is ollama running?".into()),
        code => CTRLBackendError::LLM(ErrContent {
            details: "Unexpected ollama status code".to_string(),
            debug: Some(format!("{}: {}", code, text_or_null(resp).await)),
        }),
    }
}

fn extract_ollama_api_error(err: reqwest::Error) -> CTRLBackendError {
    if err.is_timeout() {
        return CTRLBackendError::LLMTimeoutError(ErrContent::from_error("Request timeout", err));
    }
    CTRLBackendError::LLM(ErrContent::from_error("Unexpected API", err))
}

pub async fn generate(
    text: String,
    url: String,
    model: Model,
    task: Task,
) -> Result<String, CTRLBackendError> {
    let client = reqwest::Client::new();
    let payload = Payload {
        model: model_to_str(model),
        prompt: task.to_prompt(text),
        keep_alive: "15m".to_string(),
        stream: false,
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
    let text_content = resp.text().await;
    if text_content.is_err() {
        return Err(CTRLBackendError::LLM(ErrContent::from_error(
            "Failed to get text response from ollama response",
            text_content.err().unwrap(),
        )))?;
    }
    let text_content = text_content.unwrap();
    let ollama_response: serde_json::Result<Response> = serde_json::from_str(&text_content);
    if ollama_response.is_err() {
        return Err(CTRLBackendError::LLM(ErrContent::from_error(
            format!(
                "Failed to parse ollama response text to expected json: text was {}",
                text_content
            )
            .as_str(),
            ollama_response.err().unwrap(),
        )))?;
    }
    Ok(ollama_response.unwrap().response)
}
