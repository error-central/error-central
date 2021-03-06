import * as path from "path";
import * as vscode from "vscode";
import * as fs from "fs";
import * as os from "os";
import * as vscode_helpers from "vscode-helpers";
import Axios, * as axios from "axios";
var ErrorCentralMonitor = require("ec-monitor");

// TODO: How to import this from ec-montior module?
/**
 * Interface/spec for recording details of an error
 */
interface IFoundError {
  sessionId?: string; // Optional identifier for terminal/session
  blobId?: number; // Id of the individual blob containing error
  date?: Date; // When this error was detected
  language?: string; // Language error was found in
  rawText: string; // Entire blob of error message
  title: string; // Best title to show
  googleQs?: Array<string>; // HACK: Queries to pass to google
}

export function activate(context: vscode.ExtensionContext) {

  context.subscriptions.push(
    vscode.commands.registerCommand("errorCentral.start", () => {
      ErrorCentralPanel.createOrShow(context.extensionPath);
    })
  );

  if (vscode.window.registerWebviewPanelSerializer) {
    // Make sure we register a serializer in activation event
    vscode.window.registerWebviewPanelSerializer(ErrorCentralPanel.viewType, {
      async deserializeWebviewPanel(
        webviewPanel: vscode.WebviewPanel,
        state: any
      ) {
        console.log(`Got state: ${state}`);
        ErrorCentralPanel.revive(webviewPanel, context.extensionPath);
      }
    });
  }
}

/**
 * Manages webview panels
 */
class ErrorCentralPanel {
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: ErrorCentralPanel | undefined;

  public static readonly viewType = "errorCentral";
  // Directory where we'll tail logs files TODO: Move all of this to ec-monitor
  public errlogPath: string = path.join(os.homedir(), ".ec", "sessions");
  public SOQueryTemplate: string =
    "https://api.stackexchange.com/2.2/search/advanced?order=desc&sort=relevance&answers=1&filter=withbody&site=stackoverflow&q=";

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionPath: string;
  private _disposables: vscode.Disposable[] = [];
  private _knownDocker: Map<string, string> = new Map();
  private ecHost: string = "localhost";

  // Hacky way of recording Problems from problempane
  private _latsetDiagnostics: Map<string, Date> = new Map();

  public static createOrShow(extensionPath: string) {

    const column = vscode.ViewColumn.Beside;

    // If we already have a panel, show it.
    if (ErrorCentralPanel.currentPanel) {
      ErrorCentralPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      ErrorCentralPanel.viewType,
      "Error Central",
      column || vscode.ViewColumn.One,
      {
        // Enable javascript in the webview
        enableScripts: true,

        // And restrict the webview to only loading content from our
        // extension's `media` directory.
        localResourceRoots: [vscode.Uri.file(path.join(extensionPath, "media"))]
      }
    );

    ErrorCentralPanel.currentPanel = new ErrorCentralPanel(
      panel,
      extensionPath
    );
  }

  public static revive(panel: vscode.WebviewPanel, extensionPath: string) {
    ErrorCentralPanel.currentPanel = new ErrorCentralPanel(
      panel,
      extensionPath
    );
  }

  private constructor(panel: vscode.WebviewPanel, extensionPath: string) {
    this._panel = panel;
    this._extensionPath = extensionPath;

    this._panel.webview.html = this._getHtmlForWebview();

    let ecm = new ErrorCentralMonitor(this._handleError);

    // Handle error events
    ecm.on("errorFound", (foundError: IFoundError) => {
      this._handleError(foundError);
    });

    // TODO: when developing locally we need to not create an infinite loop
    // by tailing our server's stdout
    setInterval(() => this._checkForDockerInstances(), 800);

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed
    // programatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case "alert":
            vscode.window.showErrorMessage(message.text);
            return;
        }
      },
      null,
      this._disposables
    );

    // Get notified of new problems/diagnostics
    vscode.languages.onDidChangeDiagnostics((e) => this._exportDiagnostics());

  }

  public dispose() {
    ErrorCentralPanel.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private _getHtmlForWebview() {
    // Local path to main script run in the webview
    const scriptPathOnDisk = vscode.Uri.file(
      path.join(this._extensionPath, "media", "main.js")
    );
    const cssPathOnDisk = vscode.Uri.file(
      path.join(this._extensionPath, "media", "main.css")
    );

    // And the uri we use to load this script in the webview
    const scriptUri = scriptPathOnDisk.with({ scheme: "vscode-resource" });
    const cssUri = cssPathOnDisk.with({ scheme: "vscode-resource" });

    // Load html file
    const html = fs.readFileSync(
      path.join(this._extensionPath, "media", "main.html")
    );

    // Use a nonce to whitelist which scripts can be run
    const nonce = getNonce();
    // Fill in vars.
    // TODO: Can we avoid eval()? See: https://stackoverflow.com/questions/29182244/convert-a-string-to-a-template-string
    let filledHtml = eval("`" + html + "`");

    return filledHtml;
  }

  public _handleError = (foundError: IFoundError) => {

    // Pass to webview
    this._panel.webview.postMessage({
      command: "ec",
      error: foundError
    });

    // Search Stack Overflow NOTE: Experimental
    this.queryStackOverflowAPI(foundError.title.split(" ").join(" OR "));
  }

  /**
   * Find all docker containers, then tail their output into same directory
   * where we're capturing local stderr.
   * TODO: Move to ec-monitor. Replace vscode_helpers.execFile with
   * https://www.npmjs.com/package/docker-cli-js
   */
  private async _checkForDockerInstances() {
    let docker_ps = null;
    try {
      docker_ps = await vscode_helpers.execFile("docker", [
        "ps",
        "--format={{.Names}}, {{.CreatedAt}}"
      ]);
    } catch (error) {
      if (error.message.startsWith("Command failed: docker ps")) {
        return; // Docker is not running
      } else {
        throw (error); // Some other error
      }
    }

    const dps_err = docker_ps.stdErr.toString();
    if (dps_err) {
      console.log(dps_err);
    }

    // convert buffer to list of machine names and iterate over them
    const ps_output = docker_ps.stdOut.toString().match(/[^\r\n]+/g) || [];
    ps_output.forEach(name_created => {
      const [name, createdAt] = name_created.split(",");
      if (name && this._knownDocker.get(name) !== createdAt) {
        this._knownDocker.set(name, createdAt);
        const targetOut = path.join(this.errlogPath, `docker_${name}.out`);
        const targetErr = path.join(this.errlogPath, `docker_${name}.err`);
        vscode_helpers.execFile("bash", [
          "-c",
          `docker logs -f ${name} > ${targetOut} 2> ${targetErr} &`
        ]);
      }
    });
  }

  /* TESTING */

  /**
   *  Handle a change in diagnostics, looking for new problems
   */
  private _exportDiagnostics() {
    let currentDiagnostics: Map<string, Date> = new Map();
    let tuples = vscode.languages.getDiagnostics();
    for (var [thisUri, thisDiagnostics] of tuples) {
      for (let thisDiagnostic of thisDiagnostics) {

        if (thisDiagnostic.severity != vscode.DiagnosticSeverity.Error) {
          // Don't bother with hints and warnings.
          continue;
        }

        // HACK: a way to identify this Problem by uri+code, so we'll
        // miss cases where same problem occurs multiple times in same file.
        const diagnosticId = `${thisUri.path}-${thisDiagnostic.code}`;
        currentDiagnostics.set(diagnosticId, new Date());
        if (this._latsetDiagnostics.get(diagnosticId)) {
          // We've already seen this Problem
          continue;
        }

        // Remember that we saw this Problem so we don't double-send to our UI
        console.log("🔵We got a thisDiagnostic !️");
        console.log("thisDiagnostic.message", thisDiagnostic.message);
        console.log("thisUri.path", thisUri.path);
        console.log(thisUri);
        console.log(thisDiagnostic);
        console.log("--------");

        // myDiagnosticOutput.startLine = thisDiagnostic.range.start.line;
        // myDiagnosticOutput.startCharacter = thisDiagnostic.range.start.character;
        // myDiagnosticOutput.endLine = thisDiagnostic.range.end.line;
        // myDiagnosticOutput.endCharacter = thisDiagnostic.range.end.character;
        // diagnosticOutputs.push(myDiagnosticOutput);

        const error: IFoundError = {
          language: thisDiagnostic.source,
          rawText: thisDiagnostic.message,
          title: thisDiagnostic.message,
          googleQs: [thisDiagnostic.message],
          sessionId: thisUri.path
        };
        this._panel.webview.postMessage({
          command: "ec",
          error: error
        });
        this.queryStackOverflowAPI(error.title.split(" ").join(" OR "));
      }
    }
    this._latsetDiagnostics = currentDiagnostics;
  }


  public queryStackOverflowAPI(q: string) {
    console.log("Querying StackOverflow with: " + q);
    let soResult = Axios.get(
      this.SOQueryTemplate + encodeURIComponent(q)
    );
    soResult.then(response => {
      console.log("We got results from StackOverflow");
      const { items, quota_remaining } = response.data;
      this._panel.webview.postMessage({ command: "questions", questions: items });
      console.log(items);
    });
    soResult.catch(err => {
      this._panel.webview.postMessage({ command: "error", message: "We have trouble getting results from the StackOverflow API." });
      console.error(err);
    });
  }

}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

