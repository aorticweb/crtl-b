// Listen for messages from the background script
chrome.runtime.onMessage.addListener(async (request: any, sender, sendResponse) => {
  if (request.action === "grabSelectedText") {
    const selectedText: string = window.getSelection()?.toString()!;
    console.log(selectedText);
    sendResponse({ selectedText });
    await navigator.clipboard.writeText(selectedText);
  }
});
