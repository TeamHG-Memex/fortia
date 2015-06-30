# -*- coding: utf-8 -*-
from __future__ import absolute_import
from tornado import web

auto = object()


class Routes(object):
    """ Nicer API for defining Tornado routes """
    def __init__(self):
        self._routes = []

    def __call__(self, pattern, kwargs=None, name=auto):
        def decorator(handler):
            _name = handler.__name__ if name is auto else name
            self._routes.append((pattern, handler, kwargs, _name))
            return handler
        return decorator

    def _iter_routes(self, common_kwargs):
        for pattern, handler, kwargs, name in self._routes:
            kwargs = (kwargs or {}).copy()
            kwargs.update(common_kwargs or {})
            yield web.url(pattern, handler, kwargs, name)

    def get_routes(self, common_kwargs=None):
        return list(self._iter_routes(common_kwargs))


route = Routes()
get_routes = route.get_routes
