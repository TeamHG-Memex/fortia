#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Demo server for Fortia.

Usage: fortia-server.py [--host=<HOST>] [--port=<PORT>]
"""
from __future__ import absolute_import
from urllib import urlencode

from docopt import docopt
from flask import Flask, request, render_template, jsonify
from w3lib.html import replace_tags, replace_entities
import scrapely

app = Flask(__name__)


def _cleanup(value):
    return " ".join(replace_entities(replace_tags(value)).strip().split())


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


@app.route("/extract", methods=['POST'])
def extract():
    """
    Extract data from a HTML page using Scrapely templates.

    This endpoint accepts a JSON-encoded object with the following data
    (all fields are required)::

        {
            "templates": [... an array of scrapely templates...],
            "html": "<HTML of a page to extract data from>",
            "url": "<url of a page HTML data is obtained from>"
        }

    """
    data = request.get_json(force=True)
    templates = [scrapely.HtmlPage(**x) for x in data['templates']]
    target = scrapely.HtmlPage(url=data['url'], body=data['html'])
    scraper = scrapely.Scraper(templates)

    res = [
        {k: _cleanup(v[0]) for k, v in record.items()}
        for record in scraper.scrape_page(target)
    ]
    return jsonify({'status': 'ok', 'result': res})


if __name__ == '__main__':
    args = docopt(__doc__)
    host = args['--host'] or '127.0.0.1'
    port = int(args['--port']) if args['--port'] else 5000
    app.run(debug=True, host=args['--host'], port=port)
