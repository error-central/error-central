// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    const vscode = acquireVsCodeApi();

    const oldState = vscode.getState();

    const ecDiv = document.getElementById('ec-raw');
    console.log(oldState);
    console.log("Loaded webview main.js");
    //vscode.setState({ count: currentCount });

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        console.info('🔵 event → ', event);
        const message = event.data; // The json data that the extension sent
        switch (message.command) {
            case 'ec':
                ecDiv.textContent += message.data;
                break;
        }
    });
}());
