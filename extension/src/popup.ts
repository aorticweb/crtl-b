document.addEventListener('DOMContentLoaded', () => {
    const copyButton = document.getElementById('copy-button') as HTMLButtonElement;
    const textBox = document.getElementById('text-box') as HTMLTextAreaElement;
  
    copyButton.addEventListener('click', () => {
      textBox.select();
      document.execCommand('copy');
    });
  
    window.addEventListener('blur', () => {
      window.close(); // Closes the popup when focus is lost
    });
  });