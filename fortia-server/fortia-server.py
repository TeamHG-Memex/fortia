#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Demo server for Fortia.

Usage: fortia-server.py [--host=<HOST>] [--port=<PORT>]
"""
from __future__ import absolute_import
from urllib import urlencode

from docopt import docopt
from flask import Flask, request, render_template
app = Flask(__name__)


@app.route("/store")
def store():
    """ Store the template """
    print(request.form)
    return "ok"


@app.route("/")
def index():
    """ Index page """

    # hardcoded example URL
    example_url = 'http://stackoverflow.com/questions/29268299/difference-between-oracle-client-and-odac'
    query = urlencode({'goto': example_url})
    fortia_url = "fortia:http://{host}:{port}?{query}".format(host=host, port=port, query=query)
    return render_template("index.html", fortia_url=fortia_url)


if __name__ == '__main__':
    args = docopt(__doc__)
    host = args['--host'] or '127.0.0.1'
    port = int(args['--port']) if args['--port'] else 5000
    app.run(debug=True, host=args['--host'], port=port)
