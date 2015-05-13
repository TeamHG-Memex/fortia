var ui = require("sdk/ui");
var tabs = require("sdk/tabs");
var dialogs = require("dialogs");
var { TabAnnotator } = require("./annotator.js");

/*
Main annotation UI.
*/
function AnnotationSidebar(button) {
    this.annotators = {};
    this.active = {};  // tab.id => true/false
    this.sidebarState = {templates: [], activeTemplateId: null};

    // init button
    this.button = button;
    this.button.on("click", (state) => {
        var tab = tabs.activeTab;
        console.log("tabs:", tabs.length);
        console.log("current tab:", tab.id);
        this.toggle(tab);
    });

    // init sidebar
    this.sidebar = ui.Sidebar({
        id: 'my-sidebar',
        title: 'Fortia Sidebar',
        url: "./sidebar/sidebar.html",
        onReady: (worker) => {
            this.sidebarWorker = worker;
            worker.port.on('sidebar:ready', () => {
                console.log("attaching to sidebar");
                this.restoreSidebarState(tabs.activeTab);

                worker.port.on("SidebarActions.saveTemplateAs", () => {
                    console.log("add-on script got SaveAs request");
                    if (!this.active){
                        console.error("annotator is inactive");
                    }
                    this.annotator().getTemplate((html) => {
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

            });
        },
        onDetach: () => {
            this.sidebarWorker = null;
        }
    });

    // setup tab events
    this.nextSuggestedIndex = 1;

    tabs.on("activate", (tab) => {
        console.log("activate tab:", tab.id);
        this.restoreSidebarState(tab, () => {
            this.render(tab);
        });
    });
    tabs.on("deactivate", (tab) => {
        console.log("deactivate tab:", tab.id);
        this.rememberSidebarState();
    });
    tabs.on("close", (tab) => {
        this.active[tab.id] = false;
        delete this.annotators[tab.id];
    });
}

AnnotationSidebar.prototype = {
    /* Render the UI for the tab */
    render: function (tab) {
        console.log("AnnotationSidebar.render()", tab.id);
        if (this.isActive(tab)){
            if (tab.id == tabs.activeTab.id) {
                this.sidebar.show();
            }
            this.annotator(tab).activate();
        }
        else {
            this.annotator(tab).deactivate();
            if (tab.id == tabs.activeTab.id) {
                this.sidebar.hide();
            }
        }
        this.updateButtonIcon();
    },

    updateButtonIcon: function () {
        var icon = this.isActive() ? "./icons/portia-64-active.png" : "./icons/portia-64.png";
        this.button.state("tab", {icon: icon});
    },

    isActive: function (tab) {
        var tab = tab || tabs.activeTab;
        return this.active[tab.id];
    },

    toggle: function (tab) {
        if (this.isActive(tab)){
            this.stop(tab);
        }
        else {
            this.start(tab);
        }
    },

    /* Stop annotation process, discard the current template */
    stop: function (tab, callback) {
        console.log("AnnotationSidebar.stop()", tab.id);
        var stop = () => {
            this.active[tab.id] = false;
            this.render(tab);
            tab.reload();
            if (callback){
                callback();
            }
        };
        if (!this.sidebarWorker) {
            this.sidebarState.activeTemplateId = null;
            stop();
        }
        else {
            this.removeCurrentTemplate(tab, (state) => {
                stop();
            });
        }
    },

    /* Start annotation process */
    start: function (tab) {
        console.log("AnnotationSidebar.start()", tab.id);
        var start = () => {
            this.active[tab.id] = true;
            this.render(tab);
        };
        if (!this.sidebarWorker) {
            start();
        }
        else {
            this.restoreSidebarState(tab, start);
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

    removeCurrentTemplate: function (tab, callback) {
        console.log("AnnotationSidebar.removeCurrentTemplate()");
        var id = tab.id;
        this.sidebarWorker.port.emit("template:remove", id);
        this.sidebarWorker.port.once("template:removed", (id) => {
            console.log("template:removed", id);
            this.rememberSidebarState(callback);
        });
    },

    /* Transfer state from sidebar frame to this.sidebarState */
    rememberSidebarState: function (callback) {
        console.log("AnnotationSidebar.rememberSidebarState()");
        if (!this.sidebarWorker){
            console.log("can't remember sidebar state - no worker");
            return;
        }
        this.getState((state) => {
            if (callback) {
                state = callback(state) || state;
            }
            this.sidebarState = state;
            console.log("AnnotationSidebar.rememberSidebarState: new state =", this.sidebarState);
        });
    },

    /* Transfer state from this.sidebarState to sidebar frame */
    restoreSidebarState: function (tab, callback) {
        console.log("AnnotationSidebar.restoreSidebarState()");
        if (!this.sidebarWorker){
            console.log("can't restore sidebar state - no worker");
            if (callback) {
                callback();
            }
            return;
        }
        this.setState(this.sidebarState, () => {
            console.log("sidebar state restored, sending template:activate to the sidebar", tab.id);
            this.sidebarWorker.port.emit("template:activate", tab.id);
            if (callback) {
                callback();
            }
        });
    },

    /*
    Get a TabAnnotator object for the current tab.
    TabAnnotator objects are not created/destroyed every time because they
    inject scripts into the page, and it is not possible to 'uninject' them.
    TODO: check if "uninjecting" is indeed impossible.
    */
    annotator: function (tab) {
        var tab = tab || tabs.activeTab;
        if (!this.annotators[tab.id]){
            this.annotators[tab.id] = new TabAnnotator(tab, this);
        }
        return this.annotators[tab.id];
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
        var id = tabs.activeTab.id;
        this.sidebarWorker.port.emit("field:add", id, name);
    },

    editField: function (name) {
        var id = tabs.activeTab.id;
        this.sidebarWorker.port.emit("field:edit", id, name);
    }
};

exports.AnnotationSidebar = AnnotationSidebar;
