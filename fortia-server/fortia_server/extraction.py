# -*- coding: utf-8 -*-
from __future__ import absolute_import
import scrapely
from w3lib.html import replace_entities, replace_tags


def _cleanup(value):
    return " ".join(replace_entities(replace_tags(value)).strip().split())


def scrapely_extract(templates_html, target_url, target_html):
    """
    Extract data using Scrapely.
    """
    # FIXME: templates shouldn't be recreated
    templates = [scrapely.HtmlPage(**x) for x in templates_html]
    target = scrapely.HtmlPage(url=target_url, body=target_html)
    scraper = scrapely.Scraper(templates)
    return [
        {k: _cleanup(v[0]) for k, v in record.items()}
        for record in scraper.scrape_page(target)
    ]
