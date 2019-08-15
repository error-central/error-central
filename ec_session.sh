# Save stderr to file
# must be `source`ed, not `bash`ed.
# https://stackoverflow.com/a/52575087/59913
# https://stackoverflow.com/questions/47302898/redirect-stdout-and-stderr-to-file-permanently-but-keep-printing-them
echo "💡 ec: Saving stderr to file: ~/.ec/$$.txt"
exec 2> >(tee ~/.ec/$$.txt 1>&2)

# get pwd of bash session with:
# https://stackoverflow.com/questions/8327139/working-directory-of-running-process-on-mac-os
# https://unix.stackexchange.com/questions/94357/find-out-current-working-directory-of-a-running-process
