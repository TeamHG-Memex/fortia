Fortia
======

Firefox extension for automatic data extraction.
It uses scrapely_ uner the hood.

License is MIT.

Running
-------

To run the extension, install cfx_, then change folder to
`firefox-addon` and execute `cfx run` from the command line.

.. _scrapely: https://github.com/scrapy/scrapely
.. _cfx: https://developer.mozilla.org/en-US/Add-ons/SDK/Tutorials/Installation

To use all extension features you also need a Python Fortia server running.
To start it, change folder to `fortia-server`, install all Python requirements
(preferably in a virtualenv) and start a server::

    cd fortia-server
    pip install -r requirements.txt
    python -m fortia_server --debug

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
