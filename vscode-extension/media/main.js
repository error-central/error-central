// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    const vscode = acquireVsCodeApi();

    const oldState = vscode.getState();

    const counter = document.getElementById('lines-of-code-counter');
    const ecDiv = document.getElementById('ec-raw');
    console.log(oldState);
    let currentCount = (oldState && oldState.count) || 0;
    counter.textContent = currentCount;
    console.log("Loaded webview main.js");
    setInterval(() => {
        counter.textContent = currentCount++;

        // Update state
        vscode.setState({ count: currentCount });

        // Alert the extension when the cat introduces a bug
        if (Math.random() < Math.min(0.001 * currentCount, 0.05)) {
            // Send a message back to the extension
            vscode.postMessage({
                command: 'alert',
                text: '🐛  on line ' + currentCount
            });
        }
    }, 100);

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        console.info('🔵 event → ', event);
        const message = event.data; // The json data that the extension sent
        switch (message.command) {
            case 'refactor':
                currentCount = Math.ceil(currentCount * 0.5);
                counter.textContent = currentCount;
                break;
            case 'ec':
                ecDiv.textContent += message.data;
                break;
        }
    });
}());
