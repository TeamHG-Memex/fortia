fortia-server
=============

This is a server required for some of the Fortia features. It allows to:

1. Run extractors from the Fortia extension ("Preview" button);
2. TODO: run extractors for pages stored in DB.

fortia-server requires Python 2.7.

Installation
------------

Install dependencies using pip::

    pip install -r requirements.txt

Running
-------

To start server, execute

::

    python -m fortia_server

Start it in debug mode::

    python -m fortia_server --debug

Configuration
-------------

Some options can be passed using command line.
Run ``python -m fortia_server --help`` to get help.

fortia-server also supports configuration files. By default, it looks
for ``fortia-server.conf`` file in common locations (`/etc`, `~/.config`);
you can set a custom config file location using ``--config`` option::

    python -m fortia_server --config ./foo.ini


