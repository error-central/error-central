echo "Not tested on zsh..." # TODO: Test on zsh

# NOTE: this file must be called with `source` not `bash`
# https://stackoverflow.com/a/52575087/59913
# https://stackoverflow.com/questions/47302898/redirect-stdout-and-stderr-to-file-permanently-but-keep-printing-them

# NOTE: $$ is process id of this terminal

# Create .ec directory if not already there
mkdir -p ~/.ec/sessions

# Let user know we're logging
touch ~/.ec/sessions/$$.txt
echo "💡 ec: Saving stderr to file: \"~/.ec/sessions/$$.txt"\"

# Run diffenv, if it's installed
if [ -x "$(command -v diffenv)" ]; then
  diffenv > ~/.ec/diffenv/$$.yaml
fi

# Log stderr to file
exec 2> >(tee ~/.ec/sessions/$$.txt 1>&2)

# Launch monitor (it will check if its already running.)
# TODO: Change to global npm once we have this in npm package.
screen -S ec-monitor -dm node ~/code/ec/ec-monitor/out/ec-monitor.js

# Get current pwd of bash session with:
# https://stackoverflow.com/questions/8327139/working-directory-of-running-process-on-mac-os
# https://unix.stackexchange.com/questions/94357/find-out-current-working-directory-of-a-running-process
