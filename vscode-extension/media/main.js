// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  console.log("Loaded webview main.js");
  const vscode = acquireVsCodeApi();
  const ecDiv = document.getElementById('ec-raw');
  const oldState = vscode.getState();
  if (oldState) {
    // Webview is being restored
    console.log(oldState);
    ecDiv.innerHTML = "Restoring stderr...\n"
    ecDiv.innerHTML += oldState.ecDivTextContent;
  }
  else {
    // Webview is launched for first time
    ecDiv.textContent = "Montioring stderr...\n"
  }
  // Handle messages sent from the extension to the webview
  window.addEventListener('message', event => {
    const message = event.data; // The json data that the extension sent
    switch (message.command) {
      case 'ec':
        const errorDivTemplate = document.getElementById('ec-error-template');
        let errorDiv = errorDivTemplate.cloneNode(true);
        errorDiv.id = null; // TODO: set to some id

        errorDiv.getElementsByClassName('ec-title')[0].innerText = 'Some error'; // TODO: Replace with name of error
        errorDiv.getElementsByClassName('ec-lines')[0].innerText = message.data;

        let link = document.createElement('a');
        link.href = `http://google.com/search?q=${encodeURIComponent(message.data)}`
        link.innerText = "Search on Google"
        errorDiv.getElementsByClassName('ec-links')[0].appendChild(link)

        ecDiv.appendChild(errorDiv);

        // Remember our total state
        vscode.setState({ ecDivTextContent: ecDiv.innerHTML });
        break;
    }
  });
}());
