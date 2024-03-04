import init, { generate, Model, Task } from './ctrl_b_wasm/ctrl_b.js';
// TODO:
// Implement a mutext to avoid running action in parrallel
// Use chrome.commands API to listen for commands registered in the manifest.
chrome.commands.onCommand.addListener(async (command: string) => {
  const _ = await init();
  if (command === "grab-selected-text") {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      let selected = await chrome.tabs.sendMessage(tabs[0].id!, { action: "grabSelectedText" });
      let generated = await generate(selected, "http://localhost:11434/", Model.Llama2, Task.Summarize);
      let stored = await chrome.tabs.sendMessage(tabs[0].id!, { action: "storeToClipBoard", content: generated});
    });
  }
});
