# Error Central

Simple script that captures all stderr and saves to files

```
source ec_session.sh
```


Install to run for all sessions:
```
echo 'source /Users/stan/tee-log.sh' >>~/.bashrc
```

or for MacOS:
```
echo 'source /Users/stan/tee-log.sh' >>~/.bash_profile
```

### Notes

The `exec...` command cannot be put into a shell script, because shell scripts get their own little version of bash which exists only for the script, and that's the one that has output redirected.
