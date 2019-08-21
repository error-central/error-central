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
        ecDiv.textContent = "Restoring stderr...\n"
        ecDiv.textContent += oldState.ecDivTextContent;
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
                ecDiv.textContent += message.data;
                vscode.setState({ ecDivTextContent: ecDiv.textContent });
                break;
        }
    });
}());
