// Listen for messages from the background script
chrome.runtime.onMessage.addListener(async (request: any, sender, sendResponse) => {
  if (request.action === "grabSelectedText") {
    const selectedText: string = window.getSelection()?.toString()!;
    sendResponse(selectedText);
    showPopup();
    setTextContent("loading...");
    return;
  }
  if (request.action === "storeToClipBoard") {
    setTextContent(request.content);
    console.log("setting text box content to: ", request.content);
    await navigator.clipboard.writeText(request.content);
    // sendResponse("copied to clipboard");
    return;
  }
});

function setTextContent(text: string) {
  const textbox = document.getElementById('text-box') as HTMLTextAreaElement;
  if (textbox) {
    textbox.value = text;
  }
}

function showPopup() {
  const copyButton = document.getElementById('copy-button') as HTMLButtonElement;
  const textbox = document.getElementById('text-box') as HTMLTextAreaElement;
  // First, check if the popup already exists in the DOM
  let popup = document.getElementById('text-container');
  if (!popup) {
    // Create the popup container
    popup = document.createElement('div');
    popup.id = 'text-container';
    popup.style.position = 'fixed';
    popup.style.top = '0';
    popup.style.right = '0';
    popup.style.width = '300px'; // Width of the popup
    popup.style.height = '200px'; // Height of the popup
    popup.style.backgroundColor = '#fff';
    popup.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    popup.style.zIndex = '10000';
    popup.style.padding = '10px';
    popup.style.boxSizing = 'border-box';
    popup.style.display = 'none'; // Initially hidden

    // Create the textbox inside the popup
    const textbox = document.createElement('textarea');
    textbox.style.width = '100%';
    textbox.style.height = '140px';
    textbox.value = 'Hello'; // The initial message
    textbox.id = 'text-box';
  
    // Create the copy button inside the popup
    const copyButton = document.createElement('button');
    copyButton.innerText = 'Copy';
    copyButton.style.width = '100%';
    copyButton.style.height = '40px';
    copyButton.style.marginTop = '10px';
    
    // Event listener for the Copy button
    copyButton.addEventListener('click', () => {
      textbox.select();
      document.execCommand('copy');
    });

    // Add the textbox and copy button to the popup container
    popup.appendChild(textbox);
    popup.appendChild(copyButton);

    // Add the popup to the body
    document.body.appendChild(popup);
  }

  // Show the popup
  popup.style.display = 'block';

  // Close the popup when clicking outside of it
  window.addEventListener('click', (event) => {
    if (event.target !== popup && event.target !== copyButton && event.target !== textbox) {
      popup.style.display = 'none';
    }
  }, { capture: true, once: true });
}
