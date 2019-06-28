#!/usr/bin/env python3
import sys
import os
import pathlib
from ec_main import ec_main

""" Simple ec handler that writes stderr to file """

def save_stderr(data: str):
    """ Save stderr to file """

    if len(data) == 1:
        # Probably user typing if only one char
        return data

    filename = os.path.expanduser('~/.ec/stderr.log')
    with open(filename, 'a') as out:
        out.write(data)
    return data

if __name__ == "__main__":
    print("Saving stderr to log file.")

    # Create dir if not exists
    pathlib.Path(os.path.expanduser('~/.ec')).mkdir(parents=True, exist_ok=True)

    ec_main(save_stderr)
