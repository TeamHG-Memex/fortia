
var ui = require("sdk/ui");
var ss = require("sdk/simple-storage");
var tabs = require("sdk/tabs");
var { prefs } = require('sdk/simple-prefs');
var { Hotkey } = require("sdk/hotkeys");

var utils = require("./utils.js");
var tabhtml = require('./tabhtml.js');
var { FortiaClient } = require("./FortiaClient.js");
var { PreviewPanel } = require("./PreviewPanel.js");
var { Log } = require("./Log.js");
var { Session } = require("./Session.js");
var { Toolbar } = require("./Toolbar.js");

/*
Main addon code which manages the complete UI: toggle button and
per-tab annotation sessions. It stores all annotation sessions
and activates/deactivates them based on user actions.
*/
function SessionManager() {
    this.sessions = {};  // tab.id => Session
    this.log = Log("SessionManager");

    /* A button for showing/hiding annotation UI */
    this.toggleButton = ui.ActionButton({
        id: "annotate-button",
        label: "Annotation Tool",
        icon: "./icons/portia-64.png",
        onClick: (state) => { this.toggleForCurrentTab() }
    });

    /* A button for extracting data from the current page using stashed template */
    // FIXME: this is temporary. We need a better UI.
    this.extractButton = ui.ActionButton({
        id: "extract-button",
        label: "Extract",
        disabled: true,
        icon: "./icons/portia-64.png",
        onClick: (state) => { this.extractFromCurrentTab() }
    });

    this.toolbar = new Toolbar((action, data) => {
        var tab = tabs.activeTab;
        this.log("toolbar action", action, data);

        switch (action) {
            case 'startAnnotation':
                this.activateAt(tab);
                break;
            case 'showPreview':
                this.extractFromCurrentTab();
                break;
            case 'saveTemplateAs':
                this.saveTemplateAs();
                break;
            default:
                if (!this.hasSession(tab.id)){
                    this.log("Annotation session is not found for the current tab");
                }

                var session = this.sessions[tab.id];
                session.handleEvent(action, data);
        }
    });

    /* A shortcut: on OS X press CMD+E to activate the UI. */
    this.toggleUIhotkey = Hotkey({
        combo: "accel-e",
        onPress: () => { this.toggleForCurrentTab() }
    });

    tabs.on("activate", (tab) => {
        this.setButtonsHighlighted(this.hasSession(tab.id));

        Object.keys(this.sessions).forEach((tabId) => {
            if (!this.hasSession(tabId)) {
                return;
            }
            var session = this.sessions[tabId];
            (tabId == tab.id) ? session.activate() : session.deactivate();
        });
    });
}


SessionManager.prototype = {

    toggleForCurrentTab: function () {
        var tab = tabs.activeTab;
        this.hasSession(tab.id) ? this.deactivateAt(tab) : this.activateAt(tab);
    },

    saveTemplateAs: function () {
        var templates = utils.mergeScrapelyTemplates(ss.storage.stashedTemplates || []);
        utils.saveScraperToFile(templates);
    },

    extractFromCurrentTab: function () {
        var tab = tabs.activeTab;
        var serverUrl = prefs['fortia-preview-server-url'];
        var templates = ss.storage.stashedTemplates;

        var fortiaClient = new FortiaClient(serverUrl);
        var preview = new PreviewPanel(fortiaClient);

        tabhtml.get(tab, (html) => {
            preview.show(html, tab.url, templates);
        });
    },

    activateAt: function (tab, fortiaServerURL) {
        if (this.hasSession(tab.id)){
            this.log("activateAt: already activated", tab.id);
        }

        if (!fortiaServerURL){
            fortiaServerURL = prefs['fortia-preview-server-url'];
        }

        this.sessions[tab.id] = new Session(tab, fortiaServerURL);
        if (tab.id == tabs.activeTab.id){
            this.setButtonsHighlighted(true);
        }

        this.sessions[tab.id].port.on("stopAnnotation", () => {
            this.deactivateAt(tab);
        });
    },

    deactivateAt: function (tab) {
        // TODO: we need a better UI
        this.extractButton.disabled = !ss.storage.stashedTemplates;

        if (!this.hasSession(tab.id)){
            this.log("deactivateAt: already deactivated", tab.id);
        }
        this.sessions[tab.id].destroy();
        delete this.sessions[tab.id];
        if (tab.id == tabs.activeTab.id) {
            this.setButtonsHighlighted(false);
        }
    },

    hasSession: function(tabId) {
        var session = this.sessions[tabId];
        return session && !session.destroyed;
    },

    setButtonsHighlighted: function (active) {
        var icon = active ? "./icons/portia-64-active.png" : "./icons/portia-64.png";
        this.toggleButton.state("tab", {icon: icon});
        this.toolbar.setActive(active);
    }
};

exports.SessionManager = SessionManager;

