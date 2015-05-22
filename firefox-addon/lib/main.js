/* Main extension entry point */

var tabs = require("sdk/tabs");
var ui = require("sdk/ui");

var protocol = require('./protocol.js');
var { SessionManager } = require("./SessionManager.js");


var fortia = new SessionManager();


// for debugging - go to some initial url
// tabs.activeTab.url = "http://stackoverflow.com/questions/29268299/difference-between-oracle-client-and-odac";
tabs.activeTab.url = "http://127.0.0.1:5000";
//tabs.activeTab.url = "https://github.com/fivethirtyeight/data";


// handle fortia: links
protocol.events.on("newChannel", function (parsed) {
    // Firefox redirects to the new URL automatically.
    // TODO: wait for redirect before displaying the annotator.
    console.log("newChannel", parsed);
    fortia.activateAt(tabs.activeTab, parsed.server);
});
