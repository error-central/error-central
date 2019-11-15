# VS Code extension for Error Central

## Development

1. For development it is best to _link_ to the `ec-monitor` module. Do this with
   the following commands starting from this directory:

   ```bash
   cd ../ec-monitor
   npm link # Creates global symlink
   cd ../vscode-extension
   npm link ec-monitor # Uses local symlink
   ```

2. In extension directory, run `npm install`

3. Select `Launch VSCode Extension` from VS Code debug launcher. ![image](https://user-images.githubusercontent.com/673455/63225582-b0337a00-c1d1-11e9-8a86-3edacc513720.png)

4. A new instance of VS Code will launch. Press <kbd>Command</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> and run the `>Error Central: Start Error Central session` to create the webview.
