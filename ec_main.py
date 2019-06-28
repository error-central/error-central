#!/usr/bin/env python3
import sys
import os.path
import select
import typing

def ec_main(stderr_processing_function: typing.Callable):
    """ Main ec logic. Accepts stderr as it comes from bash magic """

    while True:
        ready, _, _ = select.select([sys.stdin], [], [], 0.0)
        if sys.stdin in ready:
            data = os.read(sys.stdin.fileno(), 4096).decode('utf-8')
            if len(data) == 0:
                break
            data = stderr_processing_function(data) # Do our magic
            os.write(sys.stdout.fileno(), bytes(data, 'utf-8'))


def demo_process(data: str):
    """ Demo of what can be done with stderr data coming through """
    data = data.replace('e','X') # Demo: replace 'e' with 'X'
    data = data.replace('\n','<< \n') # Demo: append '<<' to end of line
    return data


if __name__ == "__main__":
    print("Demo EC. 'e' will be replaced with 'X', with '<<' added to line end.")
    ec_main(demo_process)
