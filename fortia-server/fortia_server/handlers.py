# -*- coding: utf-8 -*-
from __future__ import absolute_import
import json
from urllib import urlencode

from tornado import web, gen
from tornado.escape import json_encode
import motor
import pymongo

from .routes import route, get_routes
from .extraction import scrapely_extract
from . import models


class BaseRequestHandler(web.RequestHandler):
    def initialize(self, db, config):
        """
        :param motor.MotorDatabase db: db
        :param fortia_server.options.Settings config: options
        """
        self.db = db
        self.config = config
        self.jobs = models.Jobs(db)


@route("/")
class Index(BaseRequestHandler):
    def get(self):

        # FIXME: hardcoded example URL
        fortia_url = build_fortia_url(
            self.config.server_url(),
            'http://stackoverflow.com/questions/29268299/'
        )
        self.render("index.html", fortia_url=fortia_url)


@route("/jobs/?")
class Jobs(BaseRequestHandler):

    @web.addslash
    @gen.coroutine
    def get(self):
        jobs = yield self.jobs.all()
        self.render("jobs.html", jobs_json=json_encode(jobs))


@route("/jobs/items/(.+)/?")
class JobItems(BaseRequestHandler):

    @gen.coroutine
    def get(self, job_id):
        last_id = self.get_argument('last_id', default=None)
        items = yield self.jobs.items(job_id, last_id=last_id)
        self.write({'status': 'ok', 'result': items})


@route("/extract/?")
class Extract(BaseRequestHandler):
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
    def post(self):
        data = json.loads(self.request.body)
        res = scrapely_extract(
            data['templates'],
            data['url'],
            data['html']
        )
        self.write({'status': 'ok', 'result': res})


def build_fortia_url(server_url, target_url):
    """
    Return an URL user should follow to start annotating
    `target_url` webpage with Fortia.
    """
    query = urlencode({'goto': target_url})
    return "fortia:http://{server_url}?{query}".format(
        server_url=server_url, query=query
    )
