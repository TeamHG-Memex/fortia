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
    this.sidebarState = {templates: [], activeTemplateId: null};
    this.sidebar = ui.Sidebar({
        id: 'my-sidebar',
        title: 'Fortia Sidebar',
        url: "./sidebar/sidebar.html",
        onReady: (worker) => {
            this.sidebarWorker = worker;
            worker.port.on('sidebar:ready', () => {
                console.log("attaching to sidebar");
                this.restoreState();

                worker.port.on("template:saveas", () => {
                    console.log("add-on script got SaveAs request");
                    if (!this.tabId){
                        console.error("tab is inactive");
                    }
                    this.annotator().getTemplate((html) => {
                        this.saveTemplateToFile(html);
                    })
                });

                worker.port.on("template:remove", () => {
                    console.log("Current template is removed");
                    this.annotator().deactivate();
                    this.hide(() => {});
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

            });
        },
        onDetach: () => {
            this.sidebarWorker = null;
        }
    });
    this.nextSuggestedIndex = 1;
    this.tabId = tabs.activeTab.id;

    tabs.on("activate", (tab) => {
        console.log("activate tab:", tab.id);
        this.tabId = tab.id;
        this.update(tab);
    });
    tabs.on("deactivate", (tab) => {
        console.log("deactivate tab:", tab.id);
        this.tabId = null;
        this.rememberState((state) => {
            state.activeTemplateId = null;
            return state;
        });
    });
    tabs.on("close", (tab) => {this.tabId = null});
}

AnnotationSidebar.prototype = {
    update: function(tab){
        var tab = tab || tabs.activeTab;
        var annotator = this.annotators[tab.id];
        if (!annotator || !annotator.active) {
            this.hide();
        }
        else {
            this.show();
        }
    },

    hide: function () {
        console.log("AnnotationSidebar.hide()");
        if (!this.sidebarWorker) {
            this.sidebar.hide();
        }
        else {
            this.rememberState((state) => {
                this.sidebar.hide();
                state.activeTemplateId = null;
                return state;
            });
        }
    },

    show: function () {
        console.log("AnnotationSidebar.show()");
        if (!this.sidebarWorker) {
            this.sidebar.show();
        }
        else {
            this.restoreState(() => this.sidebar.show());
        }
    },

    getState: function (callback) {
        if (this._getStateLocked){
            // FIXME
            console.error("can't run getState: locked");
        }
        this._getStateLocked = true;
        this.sidebarWorker.port.emit("state:get");
        this.sidebarWorker.port.once("sidebar:state", (state) => {
            this._getStateLocked = false;
            callback(state);
        });
    },

    setState: function (state, callback) {
        if (this._setStateLocked){
            // FIXME
            console.error("can't run setState: locked");
        }
        this.sidebarWorker.port.emit("state:set", state);
        this.sidebarWorker.port.once("sidebar:state-updated", () => {
            this._setStateLocked = false;
            callback();
        });
    },

    rememberState: function (callback) {
        console.log("AnnotationSidebar.rememberState()");
        if (!this.sidebarWorker){
            console.log("can't remember state - no worker");
            return;
        }
        this.getState((state) => {
            if (callback) {
                state = callback(state);
            }
            this.sidebarState = state;
        });
    },

    restoreState: function (callback) {
        console.log("AnnotationSidebar.restoreState()");
        this.setState(this.sidebarState, () => {
            console.log("state restored, activating", this.tabId);
            this.sidebarWorker.port.emit("template:activate", this.tabId);
            if (callback) {
                callback();
            }
        });
    },

    annotator: function () {
        return this.annotators[this.tabId];
    },

    /* Ask user where to save the template and save it. */
    saveTemplateToFile: function (html) {
        // FIXME: it should be per-template
        var filename = "scraper-" + this.nextSuggestedIndex + ".json";
        var pageData = {
            url: tabs.activeTab.url,
            headers: [],
            body: html,
            page_id: null,
            encoding: 'utf-8'
        };
        var data = JSON.stringify({templates: [pageData]});
        var ok = dialogs.save("Save the template", filename, data);
        if (ok){
            this.nextSuggestedIndex += 1;
        }
    },

    // FIXME: template id is just tab id for now
    addField: function (name) {
        this.sidebarWorker.port.emit("field:add", this.tabId, name);
    },

    editField: function (name) {
        this.sidebarWorker.port.emit("field:edit", this.tabId, name);
    }
};

exports.AnnotationSidebar = AnnotationSidebar;
