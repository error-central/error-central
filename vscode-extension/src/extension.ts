import * as path from 'path';
import * as vscode from 'vscode';
import * as tail from 'tail';
import * as fs from 'fs';
import * as os from 'os';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('errorCentral.start', () => {
			ErrorCentralPanel.createOrShow(context.extensionPath);
		})
	);

	if (vscode.window.registerWebviewPanelSerializer) {
		// Make sure we register a serializer in activation event
		vscode.window.registerWebviewPanelSerializer(ErrorCentralPanel.viewType, {
			async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
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

	public static readonly viewType = 'errorCentral';
	public errlogPath: string = path.join(os.homedir(), '.ec');

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionPath: string;
	private _disposables: vscode.Disposable[] = [];
	private _knownErrlogs: {[path:string]: tail.Tail} = {};

	public static createOrShow(extensionPath: string) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it.
		if (ErrorCentralPanel.currentPanel) {
			ErrorCentralPanel.currentPanel._panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			ErrorCentralPanel.viewType,
			'Error Central',
			column || vscode.ViewColumn.One,
			{
				// Enable javascript in the webview
				enableScripts: true,

				// And restrict the webview to only loading content from our extension's `media` directory.
				localResourceRoots: [vscode.Uri.file(path.join(extensionPath, 'media'))]
			}
		);

		ErrorCentralPanel.currentPanel = new ErrorCentralPanel(panel, extensionPath);
	}

	public static revive(panel: vscode.WebviewPanel, extensionPath: string) {
		ErrorCentralPanel.currentPanel = new ErrorCentralPanel(panel, extensionPath);
	}

	private constructor(panel: vscode.WebviewPanel, extensionPath: string) {
		this._panel = panel;
		this._extensionPath = extensionPath;

		this._panel.webview.html = this._getHtmlForWebview();
		setInterval(() => this._checkForErrlogs(), 800);

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'alert':
						vscode.window.showErrorMessage(message.text);
						return;
				}
			},
			null,
			this._disposables
		);
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
			path.join(this._extensionPath, 'media', 'main.js')
		);

		// And the uri we use to load this script in the webview
		const scriptUri = scriptPathOnDisk.with({ scheme: 'vscode-resource' });

		// Use a nonce to whitelist which scripts can be run
		const nonce = getNonce();

		return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">

                <!--
                Use a content security policy to only allow loading images from https or from our extension directory,
                and only allow scripts that have a specific nonce.
                -->
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-resource: https:; script-src 'nonce-${nonce}';">

                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Error Central</title>
            </head>
            <body>
				<h1 id="lines-of-code-counter">0</h1>

				Ha ha ha this is fun.

                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>b
            </html>`;
	}

	private _checkForErrlogs(){

		this._knownErrlogs;
		fs.readdir(this.errlogPath, (err, files) => {
			if (err) {
				return console.log('Unable to scan ec directory: ' + err);
			}

			//listing all files using forEach
			files.forEach((file) => {
				if (file in this._knownErrlogs === false){
					const options = {
						'separator': 'Ʋ', // set to some uncommmon character as line separator in order to process whole blobs
						'follow': true,
						'flushAtEOF': true};
					try {
						let t = new tail.Tail(path.join(this.errlogPath, file), options);
						this._knownErrlogs[file] = t;

						console.log(t);
						t.on('line', (data) => {
							console.log(data);
						});
					} catch (error) {
						console.log(error);
					}
				}
			});
		  });
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
