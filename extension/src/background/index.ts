import init, { stream, Model, Task } from "./ctrl_b_wasm";

// TODO:
// Implement a mutext to avoid running action in parrallel
chrome.commands.onCommand.addListener(async (command: string) => {
  const _ = await init();
  if (command === "grab-selected-text") {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      let selected = await chrome.tabs.sendMessage(tabs[0].id!, { action: "grabSelectedText" });
      async function llm_stream_disp_callback(value: string) {
        await chrome.tabs.sendMessage(tabs[0].id!, { action: "dispLLMOutput", content: value});
      }
      await stream(selected, "http://localhost:11434/", Model.Llama2, Task.Summarize, llm_stream_disp_callback)
      .catch(async (e: any) => {
        await chrome.tabs.sendMessage(tabs[0].id!, { action: "dispLLMFailure"});
        console.error(e);
      })
    });
  }
});