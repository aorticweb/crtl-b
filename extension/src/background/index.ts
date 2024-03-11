import { func } from "prop-types";
import init, { summarize_task, change_tone_task, Tone, Model} from "./ctrl_b_wasm/ctrl_b.js";


chrome.runtime.onInstalled.addListener(async () => {
  const _ = await init();
});

function summarize(): void{
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    let selected = await chrome.tabs.sendMessage(tabs[0].id!, { action: "grabSelectedText" });
    async function llm_stream_disp_callback(value: string) {
      await chrome.tabs.sendMessage(tabs[0].id!, { action: "dispLLMOutput", content: value});
    }
    await summarize_task(selected, "http://localhost:11434/", Model.Llama2, llm_stream_disp_callback)
    .catch(async (e: any) => {
      await chrome.tabs.sendMessage(tabs[0].id!, { action: "dispLLMFailure"});
      console.error(e);
    })
  });
}

function change_tone(tone: Tone): void{
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    let selected = await chrome.tabs.sendMessage(tabs[0].id!, { action: "grabSelectedText" });
    async function llm_stream_disp_callback(value: string) {
      await chrome.tabs.sendMessage(tabs[0].id!, { action: "dispLLMOutput", content: value});
    }
    await change_tone_task(selected, "http://localhost:11434/", Model.Llama2, tone, llm_stream_disp_callback)
    .catch(async (e: any) => {
      await chrome.tabs.sendMessage(tabs[0].id!, { action: "dispLLMFailure"});
      console.error(e);
    })
  });
}


// TODO:
// Implement a mutext to avoid running action in parrallel
chrome.commands.onCommand.addListener(async (command: string) => {
  if (command === "grab-selected-text") {
    summarize();
  }
});


chrome.contextMenus.create({
  id: 'ctrl-b-main',
  title: 'CTRL-B',
  contexts: ['all'],
});

chrome.contextMenus.create({
  id: 'ctrl-b-summarize',
  title: 'Summarize',
  contexts: ['all'],
  parentId: 'ctrl-b-main'
});


chrome.contextMenus.create({
  id: 'ctrl-b-tone',
  title: 'Change Tone',
  contexts: ['all'],
  parentId: 'ctrl-b-main'
});


const tone_options: Record<string, {enum: Tone, name: string}> = {
  "ctrl-b-tone-professional":     {enum:Tone.Professional, name:"Professional"},
  "ctrl-b-tone-casual":           {enum:Tone.Casual,name:"Casual"},
  "ctrl-b-tone-straightforward":  {enum:Tone.StraightForward ,name:"Straight forward"},
  "ctrl-b-tone-confident":        {enum:Tone.Confident ,name:"Confident"},
  "ctrl-b-tone-friendly":         {enum:Tone.Friendly ,name:"Friendly"},
  "ctrl-b-tone-strict":           {enum:Tone.Strict ,name:"Strict"},
};

Object.keys(tone_options).forEach((id) => {
  chrome.contextMenus.create({
    id: id,
    title: tone_options[id].name,
    contexts: ['all'],
    parentId: 'ctrl-b-tone'
  });
});


chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'ctrl-b-summarize') {
    summarize();
  } else if (info.menuItemId in tone_options) {
    change_tone(tone_options[info.menuItemId].enum);
  }
});
