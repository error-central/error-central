# ec-bash: Error Central Bash Script

Simple script that captures all `stderr` data and logs it to files.

To try it in a terminal type:

```bash
source ec_session.sh
```

## Install

1. Move the file `ec_session.sh` to your home folder (or whereever you like).

2. Install to run for all sessions on Linux:

```bash
echo 'source /Users/stan/ec_session.sh' >>~/.bashrc
```

or for MacOS:

```bash
echo 'source /Users/stan/ec_session.sh' >>~/.bash_profile
```

## Development

_We reccomend using the VS Code workspace `./ec.code-workspace` which allows you to work on all EC components simultaneously._
