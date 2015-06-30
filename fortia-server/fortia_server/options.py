# -*- coding: utf-8 -*-
from __future__ import absolute_import
import os
from ConfigParser import SafeConfigParser

_ROOT = os.path.abspath(os.path.dirname(__file__))

FILENAMES = [
    os.path.join(_ROOT, 'settings', 'defaults.conf'),
    '/etc/fortia-server.conf',
    os.path.expanduser('~/.config/fortia-server.conf'),
    os.path.expanduser('~/.fortia-server.conf'),
]


class Settings(SafeConfigParser):
    def is_debug(self):
        return self.getboolean('fortia-server', 'debug')

    def host(self):
        return self.get('fortia-server', 'host')

    def port(self):
        return self.getint('fortia-server', 'port')

    def server_url(self):
        return "{host}:{port}".format(host=self.host(), port=self.port())


def load(config_files=None, overrides=None):
    cp = Settings()
    cp.read(FILENAMES + (config_files or []))
    for section, option, value in (overrides or []):
        cp.set(section, option, value)
    return cp
