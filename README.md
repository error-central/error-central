# Error Central

Simple script that captures all stderr and runs it through an `ec` command.

```
# For safety, create a nested bash session that you can exit from.
bash


# The magic happens here
exec 2> >(./ec_main.py 1>&2)

```

From now until you type `exit`, all stderr goes through `ec`

Or to save to file
```
exec 2> >(./ec_save.py 1>&2)
```

### Notes

The `exec...` command cannot be put into a shell script, because shell scripts get their own little version of bash which exists only for the script, and that's the one that has output redirected.
