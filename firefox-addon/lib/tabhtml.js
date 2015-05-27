/* A module for retreiving HTML contents of a given tab */

var tabs = require("sdk/tabs");
var script = 'self.port.on("tabhtml:get", function () {' +
               'self.port.emit("tabhtml:html", document.documentElement.outerHTML);' +
             '});';

exports.get = function (tab, callback) {
    var worker = tab.attach({contentScript: script});
    worker.port.once("tabhtml:html", callback);
    worker.port.emit("tabhtml:get");
};
