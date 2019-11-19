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
  diffenv > ~/.ec/diffenv/$$.yaml
fi

# Log to file
if [ -n $EC_LOG_STDOUT_FLAG ]; then
  # Flag is set, log stdout+stderr
  # (Needed for e.g. Typescript, see https://github.com/Microsoft/TypeScript/issues/615 )
  # https://unix.stackexchange.com/a/145654/311933
  exec &> >(tee ~/.ec/sessions/$$.txt)
else
  # Log only stderr (Normal case)
  exec 2> >(tee ~/.ec/sessions/$$.txt 1>&2)
fi


# Launch monitor (it will check if its already running.)
node /usr/local/lib/node_modules/error-central/out/ec-monitor.js &
disown
# Alternate launch method that doesn't print anything:
# screen -S ec-monitor -dm node /usr/local/lib/node_modules/error-central/out/ec-monitor.js

# Get current pwd of bash session with:
# https://stackoverflow.com/questions/8327139/working-directory-of-running-process-on-mac-os
# https://unix.stackexchange.com/questions/94357/find-out-current-working-directory-of-a-running-process
