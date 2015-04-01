var ui = require("sdk/ui");
var tabs = require("sdk/tabs");
var dialogs = require("dialogs");

/*
Sidebar object.
Unfinished.

XXX: refactor it? It could make more sense for TabAnnotator to listen
for Sidebar events instead of calling TabAnnotator methods from a sideabar.
*/
function AnnotationSidebar(annotators){
    this.annotators = annotators;
    this.sidebar = ui.Sidebar({
        id: 'my-sidebar',
        title: 'Fortia Sidebar',
        url: "./sidebar/sidebar.html",
        onReady: (worker) => {
            worker.port.on("template:saveas", () => {
                console.log("add-on script got SaveAs request");
                if (!this.tabId){
                    console.error("tab is inactive");
                }
                this.annotator.getTemplate((html) => {
                    this.saveTemplateToFile(html);
                })
            });

            worker.port.on("field:renamed", (oldName, newName) => {
                this.annotator().renameField(oldName, newName);
            });

            worker.port.on("field:removed", (name) => {
                this.annotator().removeField(name);
            });

            worker.port.on("field:hovered", (name) => {
                this.annotator().highlightField(name);
            });

            worker.port.on("field:unhovered", (name) => {
                this.annotator().unhighlightField(name);
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
    tabs.on("deactivate", (tab) => {this.tabId = null});
    tabs.on("close", (tab) => {this.tabId = null});
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

    annotator: function () {
        return this.annotators[this.tabId];
    },

    /* Ask user where to save the template and save it. */
    saveTemplateToFile: function (html) {
        let filename = "scrapely-template-" + this.nextSuggestedIndex + ".html";
        let ok = dialogs.save("Save the template", filename, html);
        if (ok){
            this.nextSuggestedIndex += 1;
        }
    },

    addField: function (name) {
        this.sidebarWorker.port.emit("field:add", name);
    },

    editField: function (name) {
        this.sidebarWorker.port.emit("field:edit", name);
    },
};

exports.AnnotationSidebar = AnnotationSidebar;
