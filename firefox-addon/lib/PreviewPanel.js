/* Utilities to show a preview of the extracted data */
var { Panel } = require("sdk/panel");
var { Log } = require("./Log.js");


function PreviewPanel(fortiaClient) {
    this.fortiaClient = fortiaClient;
    this.log = Log("PreviewPanel");
}

PreviewPanel.prototype = {
    show: function (html, url, templates) {
        this.fortiaClient.request({
            endpoint: "extract",
            content: {
                url: url,
                html: html, // FIXME: strip scrapely annotations
                templates: templates
            },
            onSuccess: (data) => {
                var panel = Panel({
                    position: {bottom: 15, right: 15, left: 15},
                    height: 200,
                    contentURL: "./preview-panel/preview-panel.html"
                });
                panel.port.on("ready", () => {
                    panel.port.emit("data", data.result);
                });
                panel.port.on("close", () => { panel.destroy() });
                panel.show();
            },
            onFailure: () => {
                this.log("show: error");
            }
        });
    }
};


exports.PreviewPanel = PreviewPanel;
