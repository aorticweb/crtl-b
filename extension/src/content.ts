// Listen for messages from the background script
chrome.runtime.onMessage.addListener(async (request: any, sender, sendResponse) => {
  if (request.action === "grabSelectedText") {
    const selectedText: string = window.getSelection()?.toString()!;
    console.log(selectedText);
    sendResponse(selectedText);
    return;
  }
  if (request.action === "storeToClipBoard") {
    await navigator.clipboard.writeText(request.content);
    sendResponse("copied to clipboard");
    return;
  }
});
