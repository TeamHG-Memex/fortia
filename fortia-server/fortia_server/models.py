# -*- coding: utf-8 -*-
from __future__ import absolute_import
import json
import time
from functools import partial

import motor
import pymongo
from bson import ObjectId
from tornado import gen


LATEST = ('_id', pymongo.DESCENDING)


class Jobs(object):
    def __init__(self, db):
        self.db = db

    @gen.coroutine
    def all(self):
        jobs = yield self.db.jobs.find().sort([LATEST]).to_list(length=None)
        for job in jobs:
            make_json_decoded(job, 'stats')
            make_timestamp(job, 'started_at')
            make_timestamp(job, 'finished_at')
            make_str(job, "_id")
        raise gen.Return(jobs)

    @gen.coroutine
    def items(self, job_id, length=20, last_id=None):

        query = {'_job_id': ObjectId(job_id)}
        if last_id is not None:
            query['_id'] = {"$gt": ObjectId(last_id)}

        cursor = self.db.items.find(query, {"body": False})

        items = yield cursor.to_list(length=length)
        for item in items:
            make_str(item, "_id")
            make_str(item, "_job_id")
            make_timestamp(item, 'crawled_at')

        raise gen.Return(items)


def to_timestamp(dt):
    """
    Convert datetime object to UNIX timestamp
    """
    return time.mktime(dt.timetuple())


def _transform_key(func, obj, key):
    if key in obj:
        obj[key] = func(obj[key])


make_timestamp = partial(_transform_key, to_timestamp)
make_json_decoded = partial(_transform_key, json.loads)
make_str = partial(_transform_key, str)


