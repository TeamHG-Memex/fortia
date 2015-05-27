/*
Annotation session.
*/
var ui = require("sdk/ui");
var ss = require("sdk/simple-storage");
var tabs = require("sdk/tabs");
var { Panel } = require("sdk/panel");
var { EventTarget } = require("sdk/event/target");
var { emit } = require('sdk/event/core');

var dialogs = require("dialogs");
var scrapelyUtils = require("./scrapely_utils.js");
var { FortiaClient } = require("./FortiaClient.js");
var { PreviewPanel } = require("./PreviewPanel.js");
var { annotators } = require("./TabAnnotator.js");
var { AppDispatcher } = require("./dispatcher.js");
var { TemplateStore } = require("./TemplateStore.js");


/* Action Creator */
function TemplateActions(templateId) {
    this.templateId = templateId;
}

TemplateActions.prototype = {
    emit: function (action, data) {
        data = data || {};
        data.templateId = this.templateId;
        console.log("TemplateActions", action, data);
        AppDispatcher.dispatch({action: action, data: data});
    }
};

/*
Annotation session object. It glues a sidebar and an in-page annotator.
*/
function Session(tab, fortiaServerUrl) {
    this.tab = tab;
    this.destroyed = false;
    this.actions = new TemplateActions(this.tab.id);
    this.port = EventTarget();

    this.fortiaClient = new FortiaClient(fortiaServerUrl);
    this.preview = new PreviewPanel(this.fortiaClient);

    this.sidebarWorker = null;
    this.sidebar = ui.Sidebar({
        id: 'my-sidebar-' + this.tab.id,
        title: 'Fortia Sidebar ' + this.tab.id,
        url: "./sidebar/sidebar.html"
    });
    this.sidebar.on('ready', (worker) => {
        this.sidebarWorker = worker;

        this.actions.emit("createTemplate");
        this._sendToWorker("template:changed", TemplateStore.get(tab.id));

        /* start listening for action requests from the sidebar */
        worker.port.on('SidebarAction', (templateId, action, data) => {
            if (templateId != this.tab.id) {
                console.error("invalid SidebarAction id", templateId, this.tab.id);
                return;
            }
            switch (action){
                case "renameField":
                case "removeField":
                case "startEditing":
                    this.actions.emit(action, data);
                    break;
                case "saveTemplateAs":
                    this.saveTemplateAs();
                    break;
                case "showPreview":
                    this.showPreview();
                    break;
                case "finish":
                    this.storeTemplate();  // TODO
                    break;
                case "stopAnnotation":
                    emit(this.port, "stopAnnotation");
                    break;
                case "field:hovered":
                    this.annotator().highlightField(data);
                    break;
                case "field:unhovered":
                    this.annotator().unhighlightField(data);
                    break;
                default:
                    throw Error("unknown SidebarAction: " + action);
            }
        });
    });
    this.sidebar.on('detach', () => { this.sidebarWorker = null });

    this.tab.on("close", () => {
        this.destroy();
        console.log("tab is closed, session is stopped");
    });

    this.activate();

    /* start listening for data change events */
    this.onDataChanged = (templateId, template) => {
        if (templateId != this.tab.id) {
            return;
        }
        console.log("Session.onDataChanged", this.tab.id);
        this._sendToWorker("template:changed", template);
    };
    TemplateStore.on("changed", this.onDataChanged);
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

    saveTemplateAs: function () {
        console.log("add-on script got saveTemplateAs request");
        this.annotator().getTemplate((html) => {
            saveTemplateToFile(html, this.tab.url);
        });
    },

    storeTemplate: function () {
        console.log("add-on script is storing the current template");
        var url = this.tab.url;
        this.annotator().getTemplate((html) => {
            ss.storage.stashedTemplates = scrapelyUtils.getScrapelyTemplates(html, url);
            console.log("add-on script saved the current template to a temporary location");
        });
    },

    showPreview: function () {
        console.log("add-on script got showPreview request");
        var url = this.tab.url;
        this.annotator().getTemplate((html) => {
            var templates = scrapelyUtils.getScrapelyTemplates(html, url);
            // FIXME: strip scrapely annotations from html
            this.preview.show(html, url, templates);
        });
    },

    annotator: function () {
        return annotators.getFor(this.tab);
    },

    activate: function () {
        annotators.activateFor(this.tab);
        this.sidebar.show();
        console.log("session is activated", this.tab.id);
    },

    deactivate: function () {
        annotators.deactivateFor(this.tab);
        this.sidebar.hide();
    },

    destroy: function () {
        this.actions.emit("deleteTemplate");
        TemplateStore.off("changed", this.onDataChanged);
        this.deactivate();
        this.sidebar.dispose();
        this.destroyed = true;
        this.tab.reload();
        console.log("session is destroyed");
    }
};


/* Ask user where to save the template and save it. */
var nextSuggestedIndex = 0;
var saveTemplateToFile = function (html, url) {
    var filename = "scraper-" + nextSuggestedIndex + ".json";
    var data = scrapelyUtils.getScraperJSON(html, url);
    var ok = dialogs.save("Save the template", filename, data);
    if (ok){
        nextSuggestedIndex += 1;
    }
};

exports.Session = Session;
