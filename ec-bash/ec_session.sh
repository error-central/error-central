# NOTE: this file must be called with `source` not `bash`
# https://stackoverflow.com/a/52575087/59913
# https://stackoverflow.com/questions/47302898/redirect-stdout-and-stderr-to-file-permanently-but-keep-printing-them

# NOTE: $$ is process id of this terminal

# Let user know we're logging
touch ~/.ec/sessions/$$.txt
echo "💡 ec: Saving stderr to file: \"~/.ec/sessions/$$.txt"\"

# Run diffenv
diffenv > ~/.ec/diffenv/$$.yaml

# Log stderr to file
exec 2> >(tee ~/.ec/sessions/$$.txt 1>&2)

# Get current pwd of bash session with:
# https://stackoverflow.com/questions/8327139/working-directory-of-running-process-on-mac-os
# https://unix.stackexchange.com/questions/94357/find-out-current-working-directory-of-a-running-process
