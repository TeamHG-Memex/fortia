var ui = require("sdk/ui");
var tabs = require("sdk/tabs");
var { Hotkey } = require("sdk/hotkeys");
//var dialogs = require("dialogs");
var { annotators } = require("./TabAnnotator.js");
var { AppDispatcher } = require("./dispatcher.js");
var { TemplateStore } = require("./TemplateStore.js");


var TemplateActions = {
    create: function (templateId) {
        AppDispatcher.dispatch({
            action: "createTemplate",
            data: {templateId: templateId}
        });
    }
};

/*
Annotation session.
*/
function Session(tab) {
    this.tab = tab;
    this.id = tab.id;
    this.destroyed = false;

    this.sidebarWorker = null;
    this.sidebar = ui.Sidebar({
        id: 'my-sidebar-' + this.id,
        title: 'Fortia Sidebar ' + this.id,
        url: "./sidebar/sidebar.html"
    });
    this.sidebar.on('ready', (worker) => { this.sidebarWorker = worker });
    this.sidebar.on('detach', () => { this.sidebarWorker = null });

    this.tab.on("close", () => {
        this.destroy();
        console.log("tab is closed, session is stopped");
    });

    this.activate();

    this.onDataChanged = (templateId, template) => {
        if (templateId != this.tab.id) {
            return;
        }
        console.log("Session.onDataChanged", this.tab.id);
        this._sendToWorker("template:changed", template);
    };
    TemplateStore.on("changed", this.onDataChanged);
    TemplateActions.create(tab.id);
}

Session.prototype = {
    _sendToWorker: function () {
        if (!this.sidebarWorker){
            console.error("Session " + this.tab.id + ": no sidebarWorker");
            return false;
        }
        this.sidebarWorker.port.emit.apply(this, arguments);
        return true;
    },

    activate: function () {
        annotators.activateFor(this.tab);
        this.sidebar.show();
        console.log("session is activated", this.id);
    },

    deactivate: function () {
        annotators.deactivateFor(this.tab);
        this.sidebar.hide();
    },

    destroy: function () {
        TemplateStore.off("changed", this.onDataChanged);
        this.deactivate();
        this.sidebar.dispose();
        this.destroyed = true;
        this.tab.reload();
        console.log("session is destroyed", this.id);
    }
};


/*
Main addon code which manages the UI: toggle button and per-tab annotation UIs.

1. It should store all annotation sessions.
2. When a new tab is activated, Fortia should find a session active in
   this tab.
3. If there is no session, a sidebar and an annotator should be hidden.
4. If there is a session, a sidebar and an annotator should be displayed,
   and their contents should be updated with session data.
*/


function Fortia() {
    this.sessions = {};  // tab.id => Session

    /* A button for showing/hiding annotation UI */
    this.toggleButton = ui.ActionButton({
        id: "annotate-button",
        label: "Annotation Tool",
        icon: "./icons/portia-64.png",
        onClick: (state) => { this.toggleForCurrentTab() }
    });

    /* A shortcut: on OS X press CMD+E to activate the UI. */
    this.toggleUIhotkey = Hotkey({
        combo: "accel-e",
        onPress: () => { this.toggleForCurrentTab() }
    });

    tabs.on("activate", (tab) => {
        this.setButtonHighlighted(this.hasSession(tab.id));

        Object.keys(this.sessions).forEach((tabId) => {
            if (!this.hasSession(tabId)) {
                return;
            }
            var session = this.sessions[tabId];
            (tabId == tab.id) ? session.activate() : session.deactivate();
        });
    });
}


Fortia.prototype = {

    toggleForCurrentTab: function () {
        var tab = tabs.activeTab;
        if (this.hasSession(tab.id)) {
            this.sessions[tab.id].destroy();
            delete this.sessions[tab.id];
            this.setButtonHighlighted(false);
        }
        else {
            this.sessions[tab.id] = new Session(tab);
            this.setButtonHighlighted(true);
        }
    },

    hasSession: function(tabId) {
        var session = this.sessions[tabId];
        return session && !session.destroyed;
    },

    setButtonHighlighted: function (active) {
        var icon = active ? "./icons/portia-64-active.png" : "./icons/portia-64.png";
        this.toggleButton.state("tab", {icon: icon});
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

exports.Fortia = Fortia;

