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

async fn stream(
    prompt: String,
    url: String,
    model: Model,
    callback_fn: js_sys::Function,
) -> js_sys::Promise {
    future_to_promise(async move {
        let callback = move |s: String| {
            let this = JsValue::NULL;
            let _ = callback_fn.call1(&this, &JsValue::from_str(&s));
        };
        // logging to js console.log for now until we can import the real function
        let result = ollama::stream(prompt, url, model, callback).await;
        match result {
            Ok(_) => Ok(JsValue::null()),
            Err(err) => {
                js_log(&format!("{:?}", err.debug()));
                Err(JsValue::from_str(&format!("{}", err)))
            }
        }
    })
}

fn summarize_task_to_prompt(text: String) -> String {
    format!(
        "Summarize the text below, keep it as succint as possible while keeping the general idea of the text, only include the summarization in your response:
    ```
    {}
    ```
    ", text)
}

#[wasm_bindgen]
pub async fn summarize_task(
    text: String,
    url: String,
    model: Model,
    callback_fn: js_sys::Function,
) -> js_sys::Promise {
    let prompt = summarize_task_to_prompt(text);
    return stream(prompt, url, model, callback_fn).await;
}

#[wasm_bindgen]
pub enum Tone {
    Professional,
    Casual,
    StraightForward,
    Confident,
    Friendly,
    Strict,
}

impl Tone {
    fn as_str(&self) -> &'static str {
        match self {
            Tone::Professional => "professional",
            Tone::Casual => "casual",
            Tone::StraightForward => "straight forward",
            Tone::Confident => "confident",
            Tone::Friendly => "friendly",
            Tone::Strict => "strict",
        }
    }
}

fn change_tone_task_to_prompt(text: String, tone: Tone) -> String {
    format!(
        "Re write the text below, to make it more {} while keeping the general idea of the text and it's length, only include the rewritten text in your response:
    ```
    {}
    ```
    ", tone.as_str(), text)
}

#[wasm_bindgen]
pub async fn change_tone_task(
    text: String,
    url: String,
    model: Model,
    tone: Tone,
    callback_fn: js_sys::Function,
) -> js_sys::Promise {
    let prompt = change_tone_task_to_prompt(text, tone);
    return stream(prompt, url, model, callback_fn).await;
}
