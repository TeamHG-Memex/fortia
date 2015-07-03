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
    MAIN = 'fortia-server'
    STORAGE = 'fortia-server.storage'

    def is_debug(self):
        return self.getboolean(self.MAIN, 'debug')

    def host(self):
        return self.get(self.MAIN, 'host')

    def port(self):
        return self.getint(self.MAIN, 'port')

    def server_url(self):
        return "{host}:{port}".format(host=self.host(), port=self.port())

    def storage_enabled(self):
        return self.getboolean(self.STORAGE, 'enabled')

    def db_uri(self):
        return self.get(self.STORAGE, 'uri')

    def db_name(self):
        return self.get(self.STORAGE, 'db_name')


def load(config_files=None, overrides=None):
    cp = Settings()
    cp.read(FILENAMES + (config_files or []))
    for section, option, value in (overrides or []):
        cp.set(section, option, value)
    return cp
