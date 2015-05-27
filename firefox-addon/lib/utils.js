/*
A module with functions for working with Scrapely templates.
*/

/* Return a short random string */
function getRandomString() {
    var res = Math.random().toString(36).substr(2);
    while (res.length < 12){
        res = res + "x";
    }
    return res;
}

/* convert HTML data to Scrapely template format */
var getPageData = function (html, url) {
    return {
        url: url,
        headers: [],
        body: html,
        page_id: null,
        encoding: 'utf-8'
    };
};

var getScrapelyTemplates = function (html, url) {
    return [getPageData(html, url)];
};


/* Return a contents of JSON file Scrapely can load */
var getScraperJSON = function (html, url) {
    return JSON.stringify({templates: getScrapelyTemplates(html, url)});
};


exports.getRandomString = getRandomString;
exports.getPageData = getPageData;
exports.getScrapelyTemplates = getScrapelyTemplates;
exports.getScraperJSON = getScraperJSON;
