var ui = require("sdk/ui");
var tabs = require("sdk/tabs");
var { Hotkey } = require("sdk/hotkeys");
var { Session } = require("./Session.js");

/*
Main addon code which manages the complete UI: toggle button and
per-tab annotation sessions. It stores all annotation sessions
and activates/deactivates them based on user actions.
*/
function SessionManager() {
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


SessionManager.prototype = {

    toggleForCurrentTab: function () {
        var tab = tabs.activeTab;
        this.hasSession(tab.id) ? this.deactivateAt(tab) : this.activateAt(tab);
    },

    activateAt: function (tab, fortiaServerUrl) {
        if (this.hasSession(tab.id)){
            console.log("SessionManager.activateAt: already activated", tab.id);
        }
        this.sessions[tab.id] = new Session(tab, fortiaServerUrl);
        if (tab.id == tabs.activeTab.id){
            this.setButtonHighlighted(true);
        }

        this.sessions[tab.id].port.on("stopAnnotation", () => {
            this.deactivateAt(tab);
        });
    },

    deactivateAt: function (tab) {
        if (!this.hasSession(tab.id)){
            console.log("SessionManager.deactivateAt: already deactivated", tab.id);
        }
        this.sessions[tab.id].destroy();
        delete this.sessions[tab.id];
        if (tab.id == tabs.activeTab.id) {
            this.setButtonHighlighted(false);
        }
    },

    hasSession: function(tabId) {
        var session = this.sessions[tabId];
        return session && !session.destroyed;
    },

    setButtonHighlighted: function (active) {
        var icon = active ? "./icons/portia-64-active.png" : "./icons/portia-64.png";
        this.toggleButton.state("tab", {icon: icon});
    }
};

exports.SessionManager = SessionManager;

