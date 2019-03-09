#!/usr/bin/env python
import hashlib
import base64
import json
import httplib
import urllib
import os.path
import sys
import requests
import time
import select

CONFIG = {'host': "error-central.com",
          'tokenized-path': "/api/tokenized",
          'dump-path': '/api/dump',
          'hash-fn': 'sha256',
          'debug': False}
CONFIG_PATH = os.path.expanduser('~/.ec.json')
HASH_FNS = {'sha256': lambda x: hashlib.sha256(x).hexdigest()}


def standard_tokenizer(line):
    simple_split = line.split()
    return [('normal', token) for token in simple_split]


def post_request(path, payload, host):
    hdr = {"content-type": "application/json"}
    conn = httplib.HTTPConnection(host)
    conn.request('POST', path, json.dumps(payload), hdr)
    response = conn.getresponse()
    data = json.loads(response.read())
    return data


def hashify_tokens(tokens, hash_fn):
    return [hashify_tokens(token, hash_fn)
            if type(token) == list
            else (token_type, hash_fn(token))
            for (token_type, token) in tokens]


def analyze(errlines,
            tokenize_fn,
            hash_fn):
    tokenized = [tokenize_fn(line) for line in errlines]
    payload = [hashify_tokens(tokenized_line, hash_fn)
               for tokenized_line in tokenized]
    response = post_request(CONFIG['tokenized-path'],
                            payload,
                            CONFIG['host'])
    return (response, tokenized)


def read_config():
    if os.path.isfile(CONFIG_PATH):
        with open(CONFIG_PATH) as json_data:
            raw_config = json.load(json_data)
            for (k,v) in raw_config.iteritems():
                CONFIG[k] = v


def upload_dump(dump):
    url = 'http://' + CONFIG['host'] + CONFIG['dump-path']
    result = requests.post(url, json={'output': dump})
    return result.json().encode()
    #dump_hash = post_request(CONFIG['dump-path'],
    #                         dump,
    #                         CONFIG['host'])
    #return dump_hash

if __name__ == "__main__":
    # print "Error central!"

    # works

    while True:
        ready, _, _ = select.select([sys.stdin], [], [], 0.0)
        if sys.stdin in ready:
            data = os.read(sys.stdin.fileno(), 4096)
            if len(data) == 0:
                break
            data = data.replace('e','X')
            data = data.replace('\n','<< \n')
            os.write(sys.stdout.fileno(), data)


    # for line in sys.stdin:
    #     print "Got a line!"
    #     print ">", line
    #     sys.stdout.flush()
    # exit()

    # while 1:
    #     time.sleep(2)
    #     print "Waiting for a line"
    #     for line in sys.stdin:
    #         print ">" + line
    #         sys.stdout.flush()

    # while True:
    #     print "yo"
    #     try:
    #         for line in sys.stdin:
    #             process(line)
    #     except IOError, e:
    #         if e.errno == errno.EPIPE:
    #             # EPIPE error
    #             print "EPIPE error"
    #         else:
    #             # Other error
    #             print "Other error"
    #         time.sleep(2)


    # try:
    #     read_config()
    #     print CONFIG
    #     while True:
    #         #(urls, tokenized) = analyze(sys.stdin.readlines(),
    #         #                            standard_tokenizer,
    #         #                            HASH_FNS[CONFIG['hash-fn']])
    #         #if analysis:
    #         #    for (description, url, params) in analysis:
    #         #        print description
    #         #        print_url = url
    #         #        for (row, column) in params:
    #         #            print_url += '&%i_%i=' + urllib.quote(tokenized[row][column])
    #         #        print print_url
    #         dump = sys.stdin.readline()
    #         print "<<<"
    #         # dump_hash = upload_dump(dump)
    #         # print 'http://' + CONFIG['host'] + '/api/dump/' + dump_hash

    # except Exception as e:
    #     print e
    #     if CONFIG['debug']:
    #         print "ec-analyze exception"
    #         print type(e), e





# todo:
# configurable tokenizer and hash function
