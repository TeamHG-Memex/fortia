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
    }
};

exports.SessionManager = SessionManager;

