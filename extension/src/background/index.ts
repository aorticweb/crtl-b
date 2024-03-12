import init, {
  stream_change_tone_task,
  stream_text_task,
  LLMRunOptions,
  Tone,
  Model,
  TextTask,
} from "./ctrl_b_wasm/ctrl_b.js";

let llm_opts: LLMRunOptions | undefined = null;

chrome.runtime.onInstalled.addListener(async () => {
  const _ = await init();
  llm_opts = new LLMRunOptions(Model.Llama2, "http://localhost:11434/");
});

async function get_selected_text(tabs: chrome.tabs.Tab[]): Promise<string> {
  return await chrome.tabs.sendMessage(tabs[0].id!, {
    action: "grabSelectedText",
  });
}

function create_llm_stream_disp_callback(
  tabId: number
): (value: string) => Promise<void> {
  return async function llm_stream_disp_callback(value: string) {
    await chrome.tabs.sendMessage(tabId, {
      action: "dispLLMOutput",
      content: value,
    });
  };
}

function llm_stream_text_task(task: TextTask): void {
  chrome.tabs.query(
    { active: true, currentWindow: true },
    async (tabs: chrome.tabs.Tab[]) => {
      stream_text_task(
        await get_selected_text(tabs),
        llm_opts,
        task,
        create_llm_stream_disp_callback(tabs[0].id!)
      ).catch(async (e: any) => {
        await chrome.tabs.sendMessage(tabs[0].id!, {
          action: "dispLLMFailure",
        });
        console.error(e);
      });
    }
  );
}

function llm_stream_change_tone_task(tone: Tone): void {
  chrome.tabs.query(
    { active: true, currentWindow: true },
    async (tabs: chrome.tabs.Tab[]) => {
      await stream_change_tone_task(
        await get_selected_text(tabs),
        llm_opts,
        tone,
        create_llm_stream_disp_callback(tabs[0].id!)
      ).catch(async (e: any) => {
        await chrome.tabs.sendMessage(tabs[0].id!, {
          action: "dispLLMFailure",
        });
        console.error(e);
      });
    }
  );
}

chrome.commands.onCommand.addListener(async (command: string) => {
  if (command === "grab-selected-text") {
    llm_stream_text_task(TextTask.Summarize);
  }
});

const action_menu: Record<string, () => void> = {};

// Order is important as the
function add_to_action_menu(
  action: chrome.contextMenus.CreateProperties,
  callback: () => void
) {
  chrome.contextMenus.create(action as chrome.contextMenus.CreateProperties);
  action_menu[action.id] = callback;
}

// Base menu
chrome.contextMenus.create({
  id: "ctrl-b-main",
  title: "CTRL-B",
  contexts: ["all"],
});

add_to_action_menu(
  {
    id: "ctrl-b-summarize",
    title: "Summarize",
    contexts: ["all"],
    parentId: "ctrl-b-main",
  },
  () => llm_stream_text_task(TextTask.Summarize)
);

add_to_action_menu(
  {
    id: "ctrl-b-improve-writing",
    title: "Improve Writing",
    contexts: ["all"],
    parentId: "ctrl-b-main",
  },
  () => llm_stream_text_task(TextTask.ImproveWriting)
);

add_to_action_menu(
  {
    id: "ctrl-b-bullet-points",
    title: "Bullet Points",
    contexts: ["all"],
    parentId: "ctrl-b-main",
  },
  () => llm_stream_text_task(TextTask.BulletPoints)
);

chrome.contextMenus.create({
  id: "ctrl-b-tone",
  title: "Change Writing Tone",
  contexts: ["all"],
  parentId: "ctrl-b-main",
});

const tone_options: { enum: Tone; name: string }[] = [
  { enum: Tone.Professional, name: "Professional" },
  { enum: Tone.Casual, name: "Casual" },
  {enum: Tone.StraightForward, name: "Straight forward",},
  { enum: Tone.Confident, name: "Confident" },
  { enum: Tone.Friendly, name: "Friendly" },
  { enum: Tone.Strict, name: "Strict" },
];

tone_options.forEach((tone_opt) => {
  add_to_action_menu(
    {
      id: "ctrl-b-tone-" + tone_opt.name ,
      title: tone_opt.name,
      contexts: ["all"],
      parentId: "ctrl-b-tone",
    },
    () => llm_stream_change_tone_task(tone_opt.enum)
  );
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  action_menu[info.menuItemId]();
});
