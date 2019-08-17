#!/usr/bin/python3

import socket
from http.server import BaseHTTPRequestHandler, HTTPServer
import time
import os
import threading

hostName = ""
hostPort = 80


class MyServer(BaseHTTPRequestHandler):

    #	GET is for clients geting the predi
    def do_GET(self):
        logfile = os.path.expanduser(os.path.join('~/.ec/', self.path[1:] + '.txt'))
        with open(logfile) as f:
            read_data = f.read()
        self.send_response(200)
        self.wfile.write(bytes("<p>You accessed path: %s</p>" % self.path[1:], "utf-8"))
        self.wfile.write(bytes("<pre>%s</pre>" % read_data, "utf-8"))


    #	POST is for submitting data.
    def do_POST(self):
        print("incomming http: ", self.path)
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        self.send_response(200)

myServer = HTTPServer((hostName, hostPort), MyServer)
print(time.asctime(), "Server Started - %s:%s" % (hostName, hostPort))

try:
    myServer.serve_forever()
except KeyboardInterrupt:
    pass

myServer.server_close()
print(time.asctime(), "Server Stops - %s:%s" % (hostName, hostPort))
