#!/bin/bash
# Simple script that captures all `stderr` data and logs it to files.

# When running, `stderr` from terminals will be written in real time
# to files in directory `~/.ec/sessions/` with filenames like `XXX.txt`,
# where XXX is the process id of that terminal.

# NOTE: this file must be called with `source` not `bash`
# https://stackoverflow.com/a/52575087/59913
# https://stackoverflow.com/questions/47302898/redirect-stdout-and-stderr-to-file-permanently-but-keep-printing-them

# NOTE: $$ is process id of this terminal

# Create .ec directory if not already there
mkdir -p ~/.ec/sessions

# Let user know we're logging
touch ~/.ec/sessions/$$.txt
echo "🐛 ec: Saving stderr to file: \"~/.ec/sessions/$$.txt"\"

# Run diffenv, if it's installed
if [ -x "$(command -v diffenv)" ]; then
  # Create .ec/diffenv directory if not already there
  mkdir -p ~/.ec/diffenv
  diffenv > ~/.ec/diffenv/$$.yaml
fi

# Log only stderr (Normal case)
exec 2> >(tee ~/.ec/sessions/$$.txt 1>&2)

# Get current directory (zsh specific)
DIR=${0:a:h}
# Script path
SCRIPT_PATH="$DIR/../../out/ec-monitor.js"

# Launch monitor
# (It will exit if another monitor is already running.)
node $SCRIPT_PATH > ~/.ec/ec-monitor.log 2>&1 &
disown

