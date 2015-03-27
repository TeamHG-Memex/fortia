var ui = require("sdk/ui");
var tabs = require("sdk/tabs");
var dialogs = require("dialogs");

/*
Sidebar object.
Unfinished.
*/
function AnnotationSidebar(annotators){
    this.annotators = annotators;
    this.sidebar = ui.Sidebar({
        id: 'my-sidebar',
        title: 'Fortia Sidebar',
        url: "./sidebar/sidebar.html",
        onReady: (worker) => {
            worker.port.on("saveTemplateAs", () => {
                console.log("add-on script got SaveAs request");
                if (!this.tabId){
                    console.error("tab is inactive");
                }
                var annotator = this.annotators[this.tabId];
                annotator.getTemplate((html) => {
                    this.saveTemplateToFile(html);
                })
            });
            this.sidebarWorker = worker;
        }
    });
    this.nextSuggestedIndex = 1;
    this.tabId = tabs.activeTab.id;

    tabs.on("activate", (tab) => {
        console.log("activate tab:", tab.id);
        this.tabId = tab.id;
        this.update(tab);
    });
    tabs.on("deactivate", (tab) => {this.tabId = null;});
    tabs.on("close", (tab) => {this.tabId = null;});
}

AnnotationSidebar.prototype = {
    update: function(tab){
        var tab = tab || tabs.activeTab;
        var annotator = this.annotators[tab.id];
        if (!annotator || !annotator.active) {
            this.sidebar.hide();
        }
        else {
            this.sidebar.show();
        }
    },

    /* Ask user where to save the template and save it. */
    saveTemplateToFile: function (html) {
        let filename = "scrapely-template-" + this.nextSuggestedIndex + ".html";
        let ok = dialogs.save("Save the template", filename, html);
        if (ok){
            this.nextSuggestedIndex += 1;
        }
    },

    addField: function (field) {
        this.sidebarWorker.port.emit("fields:add", field);
    }
};

exports.AnnotationSidebar = AnnotationSidebar;
