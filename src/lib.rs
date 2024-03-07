use serde::Serialize;
use std::fmt;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::{future_to_promise, js_sys};
mod ollama;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn js_log(s: &str);
}

#[derive(Debug)]
pub struct ErrContent {
    details: String,
    debug: Option<String>,
}

impl ErrContent {
    fn from_error(details: &str, err: impl std::error::Error) -> Self {
        Self {
            details: details.to_string(),
            debug: Some(format!("{:?}", err)),
        }
    }
    fn debug(&self) -> String {
        self.debug.clone().unwrap_or("null".to_string())
    }
}

impl From<&str> for ErrContent {
    fn from(text: &str) -> Self {
        Self {
            details: text.to_string(),
            debug: None,
        }
    }
}

#[derive(Debug)]
pub enum CTRLBackendError {
    LLMTimeoutError(ErrContent),
    LLMConnection(ErrContent),
    LLM(ErrContent),
    Unexpected(ErrContent),
}

// TODO:
// the repetition is not really nice
impl CTRLBackendError {
    fn details(&self) -> String {
        match self {
            CTRLBackendError::LLMTimeoutError(ec) => {
                format!("LLM timeout error: {}", ec.details)
            }
            CTRLBackendError::LLMConnection(ec) => {
                format!("LLM connection error: {}", ec.details)
            }
            CTRLBackendError::LLM(ec) => {
                format!("LLM generic error: {}", ec.details)
            }
            CTRLBackendError::Unexpected(_) => "Unexpected error".to_string(),
        }
    }

    fn debug(&self) -> String {
        match self {
            CTRLBackendError::LLMTimeoutError(ec) => {
                format!("LLM timeout error: {} with {:?}", ec.details, ec.debug())
            }
            CTRLBackendError::LLMConnection(ec) => {
                format!("LLM connection error: {} with {:?}", ec.details, ec.debug())
            }
            CTRLBackendError::LLM(ec) => {
                format!("LLM generic error: {} with {:?}", ec.details, ec.debug())
            }
            CTRLBackendError::Unexpected(ec) => {
                format!("Unexpected error with {:?}", ec.debug())
            }
        }
    }
}
impl fmt::Display for CTRLBackendError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "CTRL-B backend: {}", self.details())
    }
}

#[wasm_bindgen]
#[derive(Debug, Clone, Copy, Serialize)]
pub enum Model {
    Llama2,
}

#[wasm_bindgen]
pub enum Task {
    Summarize,
}

impl Task {
    pub fn to_prompt(&self, text: String) -> String {
        match self {
            Task::Summarize => format!(
                "Summarize the text below, keep it as succint as possible while keeping the general idea of the text:
            ```
            {}
            ```
            ", text),
        }
    }
}

#[wasm_bindgen]
pub async fn generate(text: String, url: String, model: Model, task: Task) -> js_sys::Promise {
    future_to_promise(async move {
        let result = ollama::generate(text, url, model, task).await;
        match result {
            Ok(content) => Ok(JsValue::from_str(&content)),
            Err(err) => {
                js_log(&format!("{:?}", err.debug()));
                Err(JsValue::from_str(&format!("{}", err)))
            }
        }
    })
}

#[wasm_bindgen]
pub async fn stream(text: String, url: String, model: Model, task: Task) -> js_sys::Promise {
    future_to_promise(async move {
        // logging to js console.log for now until we can import the real function
        let result = ollama::stream(text, url, model, task, |s| js_log(&s)).await;
        match result {
            Ok(_) => Ok(JsValue::null()),
            Err(err) => {
                js_log(&format!("{:?}", err.debug()));
                Err(JsValue::from_str(&format!("{}", err)))
            }
        }
    })
}
