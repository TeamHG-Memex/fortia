var tabs = require("sdk/tabs");
var ui = require("sdk/ui");

var { AppDispatcher } = require("./dispatcher.js");
var { TemplateStore } = require("./TemplateStore.js");


/*
Wrapper for worker Annotator object (for a script injected into a page).
*/
function TabAnnotator(tab){
    console.log("creating TabAnnotator for ", tab.id, tab.url);
    this.tab = tab;
    this.scripts = [
        "./vendor/jquery-2.1.3.js",
        "./vendor/fabric-1.4.0.js",
        "./vendor/minivents.js",

        "./annotator/utils.js",
        "./annotator/ElementOutline.js",
        "./annotator/CanvasOverlay.js",
        "./annotator/ElementSelector.js",
        "./annotator/DomAnnotations.js",
        "./annotator/AnnotationsDisplay.js",
        "./annotator/annotator.js"
    ];
    this.active = false;

    tab.on("ready", (tab) => {
        if (tab.url.startsWith("about:")){
            return;
        }
        console.log("TabAnnotator: tab.ready", tab.id);
        this._injectScripts();
        this.lock();
    });

    tab.on("pageshow", (tab) => {
        if (tab.url.startsWith("about:")){
            return;
        }
        console.log("TabAnnotator: tab.pageshow", tab.id);
        this.update();
    });

    this._injectScripts();
}

TabAnnotator.prototype = {
    lock: function(){
        console.log("lock", this.worker.tab.id);
        if (!this.active) {
            return;
        }
        this.worker.port.emit("lock");
    },

    update: function(){
        console.log("TabAnnotator.update", this.worker.tab.id);
        if (this.active) {
            console.log("TabAnnotator.activate", this.worker.tab.id);
            this.worker.port.emit("activate");
        }
        else {
            console.log("TabAnnotator.deactivate", this.worker.tab.id);
            this.worker.port.emit("deactivate");
        }
    },

    activate: function(){
        this.active = true;
        this.update();
    },

    deactivate: function(){
        this.active = false;
        this.update();
    },

    toggle: function(){
        this.active = !this.active;
        this.update();
    },

    /* Call the callback with the current template HTML */
    getTemplate: function (callback) {
        var onReady = (html) => {
            callback(html);
            this.worker.port.removeListener("annotator:template", onReady);
        };
        this.worker.port.on("annotator:template", onReady);
        this.worker.port.emit("getTemplate");
    },

    /* Field name changed - update the template with the new field name */
    renameField: function(oldName, newName){
        this.worker.port.emit("renameField", oldName, newName);
    },

    /* Field is deleted - remove all annotations for this field from the template */
    removeField: function(name){
        this.worker.port.emit("removeField", name);
    },

    /* Highlight all annotations with this field name */
    highlightField: function (name) {
        this.worker.port.emit("highlightField", name);
    },

    /* Don't highlight annotations with this field name */
    unhighlightField: function (name) {
        this.worker.port.emit("unhighlightField", name);
    },

    _injectScripts: function(){
        var tab = this.tab;
        console.log("TabAnnotator._injectScripts to ", tab.id);

        this.worker = tab.attach({contentScriptFile: this.scripts});
        this.worker.port.on("AnotatorAction", function (action, data) {
            data.tabId = tab.id;
            console.log("AnotatorAction", action, data);
            AppDispatcher.dispatch({
                action: action,
                data: data
            });
        });
        TemplateStore.on("fieldCreated", this.onFieldCreated.bind(this));

        //this.worker.port.on("field:added", (info) => {
        //    console.log("field:added", info);
        //    var field = info["data"]["annotations"]["content"];
        //    // FIXME: sidebar should listen for events
        //    this.sidebar.addField(field);
        //});
        //
        //this.worker.port.on("field:edit", (name) => {
        //    console.log("field:edit", name);
        //    // FIXME: sidebar should listen for events
        //    this.sidebar.editField(name);
        //});
    },

    onFieldCreated: function (templateId, data) {
        if (templateId != this.tab.id){
            return;
        }
        this.worker.port.emit("fieldCreated", data.selector, data.name);
    }
};


function TabAnnotators() {
    this.annotators = {};
}

TabAnnotators.prototype = {
    getFor: function (tab) {
        if (!this.existsFor(tab)) {
            this.annotators[tab.id] = new TabAnnotator(tab);
        }
        return this.annotators[tab.id];
    },

    activateFor: function(tab) {
        this.getFor(tab).activate();
    },

    deactivateFor: function (tab) {
        if (!this.existsFor(tab)){
            return;
        }
        this.annotators[tab.id].deactivate();
    },

    existsFor: function (tab) { return !!this.annotators[tab.id] },
};

var annotators = new TabAnnotators();

exports.TabAnnotator = TabAnnotator;
exports.annotators = annotators;
