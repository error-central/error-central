// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  console.log("Loaded webview main.js");
  const vscode = acquireVsCodeApi();
  const ecDiv = document.getElementById("ec-raw");
  const oldState = vscode.getState();
  const errorId = message => `error-card-${message.error.blobId}`;

  const initErrorDiv = (message) => {
    const errorDivTemplate = document.getElementById("ec-error-template");
    let errorDiv = errorDivTemplate.cloneNode(true);
    errorDiv.id = errorId(message);

    errorDiv.getElementsByClassName("ec-title")[0].innerText =
      message.error.title;
    errorDiv.getElementsByClassName("ec-lines")[0].innerText =
      message.error.rawText;

    for (const q of message.error.googleQs) {
      let link = document.createElement("a");
      link.href = `http://google.com/search?q=${encodeURIComponent(q)}`;
      link.innerText = q;
      link.className = "ec-google-link";
      errorDiv.getElementsByClassName("ec-links")[0].appendChild(link);
    }

    // Create issue button
    // TODO: Flesh this out
    let link = document.createElement("a");
    link.href = `https://github.com/error-central/diffenv/issues/new?title=${message.error.title}&body=${message.error.rawText}`;
    link.innerText = "Create Issue";
    link.className = "ec-create-gh-issue";
    errorDiv.getElementsByClassName("ec-links")[0].appendChild(link);

    ecDiv.appendChild(errorDiv);
    return errorDiv;
  };

  if (oldState) {
    // Webview is being restored
    console.log(oldState);
    ecDiv.innerHTML = "Restoring stderr...\n";
    ecDiv.innerHTML += oldState.ecDivTextContent;
  } else {
    // Webview is launched for first time
    ecDiv.textContent = "Montioring stderr...\n";
  }
  // Handle messages sent from the extension to the webview
  window.addEventListener("message", event => {
    const message = event.data; // The json data that the extension sends
    switch (message.command) {
      case "ec":
        initErrorDiv();
        break;
      case "ec-results":
        const questionDivTemplate = document.getElementById("stackex-question-template");
        const answerDivTemplate = document.getElementById("stackex-answer-template");
        let errorDiv = document.getElementById(errorId(message));
        if (errorDiv == null) {
          // initialize it if not already initialized
          errorDiv = initErrorDiv(message);
        }
        let questionsDiv = errorDiv.getElementsByClassName('stackex-questions')[0];
        // iterate over questions and render them
        message.questions.forEach(question => {
          let questionDiv = questionDivTemplate.cloneNode(true);
          questionDiv.getElementsByClassName('stackex-post-body')[0].innerHTML = question['body'];
          questionDiv.getElementsByClassName('stackex-question-title')[0].innerText = question['title'];
          questionDiv.addEventListener('click', () => {
            // todo: toggle others
          })
          let answersDiv = questionDiv.getElementsByClassName('stackex-answers')[0];
          question['answers'].forEach(answer => {
            let answerDiv = answerDivTemplate.cloneNode(true);
            answerDiv.getElementsByClassName('stackex-post-body')[0].innerHTML = answer['body'];
            answersDiv.appendChild(answerDiv);
          })
          questionsDiv.appendChild(questionDiv);
        })
        break;
    }
    // Remember our total state
    vscode.setState({ ecDivTextContent: ecDiv.innerHTML });
  });
})();
