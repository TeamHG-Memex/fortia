Fortia
======

Firefox extension for automatic data extraction.
It uses scrapely_ under the hood.

License is MIT.

.. _scrapely: https://github.com/scrapy/scrapely

Running
-------

To run the addon see :file:`firefox-addon/README.rst`.

To use all extension features you also need a Python Fortia server running.
To start it, change folder to `fortia-server`, install all Python requirements
(preferably in a virtualenv) and start a server::

    cd fortia-server
    pip install -r requirements.txt
    ./fortia-server.py --debug

Project Structure
-----------------

* :path:`firefox-addon` is the Fortia Firefox addon.
* :path:`fortia-server` is a Python server required for some of the
  addon features.
* :path:`example-spider` folder contains an example Scrapy_ spider
  which can crawl websites and extract data using templates created with
  Fortia.

See README files in these folders for more details.

.. _Scrapy: http://scrapy.org/
