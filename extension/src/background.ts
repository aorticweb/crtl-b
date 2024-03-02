// TODO:
// Implement a mutext to avoid running action in parrallel
// Use chrome.commands API to listen for commands registered in the manifest.
chrome.commands.onCommand.addListener((command: string) => {
  if (command === "grab-selected-text") {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      let me = await chrome.tabs.sendMessage(tabs[0].id!, { action: "grabSelectedText" });
      console.log(me);
    });
  }
});
