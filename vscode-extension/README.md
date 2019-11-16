# VS Code extension for Error Central

## Development

_We reccomend using the VS Code workspace `./ec.code-workspace` which allows
you to work on all EC components simultaneously._

1. For development it is best to _link_ to the `ec-monitor` module, so changes
   to its code are immediately used elsewhere. Do this with
   the following commands starting from this directory:

   ```bash
   cd ../ec-monitor

   npm link # Creates system symlink for `ec-monitor`

   tsc --project . # Compile ts into js

   cd ../vscode-extension

   npm link ec-monitor # Uses local symlink

   npm install
   ```

2. Select `Launch VSCode Extension` from VS Code debug launcher.
   ![image](https://user-images.githubusercontent.com/673455/63225582-b0337a00-c1d1-11e9-8a86-3edacc513720.png)

3. A new instance of VS Code will launch. Press
   <kbd>Command</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> and run the
   `>Error Central: Start Error Central session` to open the extension window.
