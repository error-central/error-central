#!/usr/bin/env python
import sys
import os.path
import select

if __name__ == "__main__":

    print "Hello from Error Central"

    while True:
        ready, _, _ = select.select([sys.stdin], [], [], 0.0)
        if sys.stdin in ready:
            data = os.read(sys.stdin.fileno(), 4096)
            if len(data) == 0:
                break
            data = data.replace('e','X') # Demo: replace 'e' with 'X'
            data = data.replace('\n','<< \n') # Demo: append '<<' to end of line
            os.write(sys.stdout.fileno(), data)
