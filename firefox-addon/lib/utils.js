/*
A module with functions for working with Scrapely templates.
*/

var dialogs = require('./dialogs.js');

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
var getScraperJSON = function (templates) {
    return JSON.stringify({templates: templates});
};


/* Merge several separate Scrapely templates into a single data structure */
var mergeScrapelyTemplates = function (templates) {
    var res = [];
    templates.forEach((pageData) => {
        res.push(pageData);
    });
    return res;
};


/* Ask user where to save the template and save it. */
var nextSuggestedIndex = 0;
var saveScraperToFile = function (templates) {
    var filename = "scraper-" + nextSuggestedIndex + ".json";
    var data = getScraperJSON(templates);
    var ok = dialogs.save("Save the template", filename, data);
    if (ok){
        nextSuggestedIndex += 1;
    }
};


exports.getRandomString = getRandomString;
exports.getPageData = getPageData;
exports.getScrapelyTemplates = getScrapelyTemplates;
exports.getScraperJSON = getScraperJSON;
exports.mergeScrapelyTemplates = mergeScrapelyTemplates;
exports.saveScraperToFile = saveScraperToFile;
