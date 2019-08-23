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
                // Add element
                let errorDiv = document.createElement('div');
                errorDiv.className = 'errorMessage';
                errorDiv.innerText = message.data;
                errorDiv.onclick = function () {
                    console.info('blah');
                    // TODO: To open web page: https://stackoverflow.com/questions/34205481/how-to-open-browser-from-visual-studio-code-api
                    document.location="https://google.com" // Won't work
                };

                let link = document.createElement('a');
                link.href = `http://google.com/search?q=${encodeURIComponent(message.data)}`
                link.innerText = "Search on Google"

                ecDiv.appendChild(errorDiv);
                ecDiv.appendChild(link);

                // Remember our total state
                vscode.setState({ ecDivTextContent: ecDiv.innerHTML });
                break;
        }
    });
}());
