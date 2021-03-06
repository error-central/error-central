# ec-monitor: Error central montitoring

Typescript package that will montitor the log files generated by `ec-bash`
and attempt to detect any error messages that appear there. Currently detecting
errors in Python, Node, Bash, and Git. An error message is something like
Python's `NameError: name 'q' is not defined`.

When an error message is found:

1. The error is sent to the ec server. (Currently very rudimentary.)
2. An javascript event is emitted. When used with the `vscode-extension`, this
   event is used to trigger display of error information in VS Code.

## Installing

Install with `npm install -g error-central`. It will ask you about your shell, 
and confirm changes to your startup script.

Example:

```
$ npm install -g error-central

> error-central@0.0.22 uninstall /usr/local/lib/node_modules/error-central
> node ./out/uninstall.js

/usr/local/bin/error-central -> /usr/local/lib/node_modules/error-central/bin/error-central.js

> error-central@0.0.22 postinstall /usr/local/lib/node_modules/error-central
> node ./out/postinstall.js

🐛 Thank you for installing Error Central! 🐛

To capture errors, we need to install a script that runs each session.
? Which shell do you use ? bash
? We will add error-central monitoring to ~/.bash_profile, is it ok ? Yes
=> Added error-central source line in "~/.bash_profile" file

      => Error-central source lines added to "~/.bash_profile" for ec package.

      To enable in this session, run:
          source ~/.bash_profile

+ error-central@0.0.22
updated 1 package in 30.496s
$
```

It will be started by default in new sessions. Activate it in the current session like this: 
```
$source ~/.bash_profile

🐛 ec: Saving stderr to file: "~/.ec/sessions/1033.txt"
$
```

Then you can test it like this:

```
$ python
Python 3.7.4 (default, Jul  9 2019, 18:13:23)
[Clang 10.0.1 (clang-1001.0.46.4)] on darwin
Type "help", "copyright", "credits" or "license" for more information.
>>> x=4+q
>>> Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
NameError: name 'q' is not defined
>>>
```

See if your error appears on the debugging page here: http://wanderingstan.com/ec/ec-dump.php


## Development

_We reccomend using the VS Code workspace `./ec.code-workspace` which allows
you to work on all EC components simultaneously._
