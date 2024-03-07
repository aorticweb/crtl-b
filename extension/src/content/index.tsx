import './scss/styles.scss'
import * as bootstrap from 'bootstrap'

import {TextboxComponent} from './box';
import React from 'react';
import ReactDOM from 'react-dom';

const container = document.createElement('div');
document.body.appendChild(container);
ReactDOM.render(<TextboxComponent />, container);

// Listen for messages from the background script
chrome.runtime.onMessage.addListener(async (request: any, sender, sendResponse) => {
  if (request.action === "grabSelectedText") {
    const selectedText: string = window.getSelection()?.toString()!;
    sendResponse(selectedText);
    showPopup();
    setTextContent("loading...");
    return;
  }
  if (request.action === "dispLLMOutput") {
    showPopup();
    setTextContent(request.content);
    sendResponse("content was displayed");
    return;
  }
  if (request.action === "dispLLMFailure") {
    setTextContent("failed to perform LLM Task");
    sendResponse("error message was displayed");
    return;
  }
});

function setTextContent(text: string) {
  const event = new CustomEvent('setText', { detail: { text: text } });
  document.dispatchEvent(event);
}

function showPopup() {
  const event = new CustomEvent('setVisibility', { detail: { isVisible: true } });
  document.dispatchEvent(event);
}
