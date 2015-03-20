var tabs = require("sdk/tabs");
var ui = require("sdk/ui");


/*
Per-tab annotation UI
*/
function TabAnnotator(tab){
    console.log("creating TabAnnotator for ", tab.id, tab.url);
    this.tab = tab;
    this.scripts = [
        "./vendor/jquery-2.1.3.js",
        "./vendor/fabric-1.4.0.js",
        "./vendor/minivents.js",

        "./annotator/outline.js",
        "./annotator/overlay.js",
        "./annotator/annotator.js"
    ];
    this.active = false;

    tab.on("ready", (tab) => {
        console.log("ready", tab.id);
        if (tab.url.startsWith("about:")){
            return;
        }
        this._injectScripts();
        this.lock();
    });

    tab.on("pageshow", (tab) => {
        console.log("pageshow", tab.id);
        if (tab.url.startsWith("about:")){
            return;
        }
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
        console.log("update", this.worker.tab.id);
        if (this.active) {
            console.log("activate", this.worker.tab.id);
            this.worker.port.emit("activate");
        }
        else {
            console.log("deactivate", this.worker.tab.id);
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

    //getTemplate: function () {
    //    var p = new Promise();
    //    this.worker.port.emit("getTemplete");
    //    this.worker.
    //},

    _injectScripts: function(){
        var tab = this.tab;
        console.log("_injectScripts to ", tab.id);
        this.worker = tab.attach({contentScriptFile: this.scripts});
    },
};

exports.TabAnnotator = TabAnnotator;
