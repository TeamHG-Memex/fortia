#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Demo server for Fortia.

Usage: fortia-server [--host=<HOST>] [--port=<PORT>] [--config=<PATH>] [--debug]
"""

from __future__ import absolute_import
import os
import logging

from docopt import docopt
from tornado import web, ioloop

from fortia_server import options
from fortia_server.handlers import get_routes


def get_db(config):
    db_uri = config.get('fortia-server.storage', 'uri')
    dn_name = config.get('fortia-server.storage', 'db_name')
    if db_uri.startswith('mongodb:'):
        import motor
        mongo_client = motor.MotorClient(db_uri)
        return mongo_client[dn_name]
    return None


def get_application(config):
    from fortia_server import handlers  # this is required to populate routes
    at_root = lambda *args: os.path.join(os.path.dirname(__file__), *args)
    context = {'db':  get_db(config), 'config': config}
    return web.Application(
        handlers=get_routes(context),
        template_path=at_root("templates"),
        debug=config.is_debug(),

        # compiled_template_cache=not config.is_debug(),
        # static_hash_cache=not config.is_debug(),
        static_path=at_root("static"),
        compress_response=True,
    )


def get_config():
    """
    Get a config object, merged from all config files and
    command-line arguments.
    """
    args = docopt(__doc__)

    config_files = []
    if args['--config']:
        path = os.path.expanduser(args['--config'])
        assert os.path.exists(path)
        config_files.append(path)

    overrides = []
    if args['--host']:
        overrides.append(['fortia-server', 'host', args['--host']])
    if args['--port']:
        overrides.append(['fortia-server', 'port', args['--port']])
    if args['--debug'] is not None:
        overrides.append(['fortia-server', 'debug', str(int(args['--debug']))])

    return options.load(config_files, overrides)


def run():
    config = get_config()
    if config.is_debug():
        log_level = logging.DEBUG
    else:
        log_level = logging.INFO
    logging.basicConfig(level=log_level)

    app = get_application(config)
    app.listen(
        config.port(),
        config.host(),
    )
    logging.debug("Fortia server is started at %s", config.server_url())
    ioloop.IOLoop.current().start()


if __name__ == '__main__':
    run()
