# VS Code extension for Error Central

## Development

_We reccomend using the VS Code workspace `./ec.code-workspace` which allows
you to work on all EC components simultaneously._

1. For development it is best to [_link_](https://docs.npmjs.com/cli/link.html) to the `ec-monitor` module, so changes
   to its code are immediately used elsewhere. Do this with
   the following commands:

   ```bash
   # Clone repo if not already there
   git clone git@github.com:error-central/error-central.git 
   cd error-central/

   cd ec-monitor/
   npm install
   npm link # Create system symlink for `ec-monitor`

   cd ../vscode-extension
   npm install
   npm link ec-monitor # Link to the local module
   
   code ../ec.code-workspace
   ```

2. Select `Run Extension` from VS Code debug launcher: 

   <img src="https://user-images.githubusercontent.com/673455/69438547-760ed280-0d02-11ea-94c5-e9075e0b5d53.png" width="300" heigh="29"/>

3. A new instance of VS Code will launch. Press
   <kbd>Command</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> and run the
   `>Error Central: Start Error Central session` to open the extension window.
   
4. Try opening a terminal (in or outside of VSCode) and creating an 
   error. The error should get displayed in the panel. For example:
   
   ```
   $ python
   Python 3.7.4 (default, Jul  9 2019, 18:13:23)
   [Clang 10.0.1 (clang-1001.0.46.4)] on darwin
   Type "help", "copyright", "credits" or "license" for more information.
   >>> x=4+q
   >>> Traceback (most recent call last):
     File "<stdin>", line 1, in <module>
   NameError: name 'q' is not defined
   ```
