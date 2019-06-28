#!/usr/bin/env python3
import sys
from ec_main import ec_main

""" Simple ec handler that writes stderr to file """

def save_stderr(data: str):
    """ Save stderr to file """

    filename='test.log'
    with open(filename, 'a') as out:
        out.write(data)
    return data

if __name__ == "__main__":
    print("Demo EC. Saving stderr to log file.")
    ec_main(save_stderr)
