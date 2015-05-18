#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Crawl a website using Scrapely template.

Usage: crawl.py <scraper.json> <url> [--depth=<depth>] [options]

1. Use Fortia Firefox extension to annotate a web page.
2. Save the template to scraper.json file using "Save as.." button.
3. Run `crawl.py` tool, passing scraper.json file and website URL as
   arguments.

Crawler will fetch a passed URL and follow all links below it.
For example, if you pass 'http://example.com/posts/' as URL then
'http://example.com/posts/2014/' will be followed, but
'http://example.com/about/' won't.

At each visited page crawler tries to extract the data using provided
Scrapely template. Extracted data is printed to stdout.

Example 1, save data to a file:
  crawl.py scraper-1.json 'http://example.com/posts/' > example-data.json

Example 2, extract data from a single URL:
  crawl.py scraper-1.json 'http://example.com/posts/2014/foo.html' --depth 0

Example 3, remove noise by dropping all records without some required fields:
  crawl.py scraper-1.json 'http://example.com/questions' --required title,votes


Options:
  -f --format=<format>      Export format. Allowed values are json, csv and jl [default: json]
  -d --depth=<depth>        Maximum crawl depth [default: 2]
  -r --required=<fields>    Comma-separated list of required fields
  -q --quite                Be less verbose
  -h --help                 Show this help

"""
from __future__ import absolute_import
import re
from docopt import docopt
import scrapy
from scrapy import log
from scrapy.crawler import CrawlerProcess
from scrapy.settings import Settings
from scrapy.contrib.linkextractors import LinkExtractor
import scrapely
from w3lib.html import replace_tags


def crawl(spider_cls, settings):
    """ Run a Scrapy spider. """
    runner = CrawlerProcess(Settings(settings))
    runner.crawl(spider_cls)
    runner.start()


class Scraper(scrapely.Scraper):
    def extract(self, response):
        """ Extract data from scrapy.Response """
        page = scrapely.HtmlPage(response.url, response.headers, response.body_as_unicode())
        return self.scrape_page(page)

    @classmethod
    def load(cls, path):
        """ Load Scraper from path """
        with open(path, "rb") as f:
            return cls.fromfile(f)


def get_spider_cls(args):
    """ Build a Spider class based on command-line arguments """

    required = args['--required']
    url = args['<url>']

    class FortiaSpider(scrapy.Spider):
        name = 'fortia'
        start_urls = [url]
        scraper = Scraper.load(args['<scraper.json>'])
        le = LinkExtractor(allow=[re.escape(url) + '.*'])
        required_fields = set() if not required else set(required.split(','))
        follow_links = args['--depth'] != '0'

        def parse(self, response):
            for record in self.scraper.extract(response):
                cleaned = {k: self.process_value(v[0]) for k, v in record.items()}
                if not cleaned:
                    continue
                if not self.required_fields <= set(cleaned.keys()):
                    continue
                cleaned['_url'] = response.url
                yield cleaned

            if self.follow_links:
                for link in self.le.extract_links(response):
                    yield scrapy.Request(link.url)

        def process_value(self, value):
            return " ".join(replace_tags(value).strip().split())

    return FortiaSpider


if __name__ == '__main__':
    args = docopt(__doc__)
    settings = dict(
        AUTOTHROTTLE_ENABLED=True,
        DOWNLOAD_HANDLERS={'s3': None},
        DEPTH_LIMIT=int(args['--depth']),
        LOG_LEVEL=log.WARNING if args['--quite'] else log.DEBUG,
        FEED_URI="stdout:",
        FEED_FORMAT=args['--format'],
    )
    spider_cls = get_spider_cls(args)
    crawl(spider_cls, settings)
