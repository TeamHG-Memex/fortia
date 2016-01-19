/* Fortia Toolbar */
var ui = require("sdk/ui");
var { Log } = require("./Log");


function Toolbar(onMessage) {
    this.log = Log("Toolbar");
    this.frame = new ui.Frame({
        url: "./toolbar/toolbar.html",
        onMessage: (r) => {onMessage(r.data.action, r.data.data)}
    });

    this.toolbar = ui.Toolbar({
        title: "Fortia Toolbar",
        items: [this.frame]
    });
}

Toolbar.prototype = {
    setActive: function(active) {
        // FIXME: it won't work well for multiple browser windows
        // See https://developer.mozilla.org/en-US/Add-ons/SDK/Low-Level_APIs/ui_frame
        if (active) {
            this.frame.postMessage({event: 'activeAnnotation'}, this.frame.url);
        }
        else {
            this.frame.postMessage({event: 'inactiveAnnotation'}, this.frame.url);
        }
    }
};

exports.Toolbar = Toolbar;
