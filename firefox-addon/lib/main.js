//var buttons = require('sdk/ui/button/action');
var tabs = require("sdk/tabs");
var ui = require("sdk/ui");
var { Hotkey } = require("sdk/hotkeys");
var { AnnotationSidebar } = require("./sidebar.js");
var { TabAnnotator } = require("./annotator.js");
var protocol = require('./protocol.js');

// a list of per-tab annotator UI objects
var annotators = {};

function getAnnotator(tab){
    if (!annotators[tab.id]){
        annotators[tab.id] = new TabAnnotator(tab, sidebar);
    }
    return annotators[tab.id];
}

tabs.on("close", function(tab){
    delete annotators[tab.id];
});


// a sidebar
var sidebar = new AnnotationSidebar(annotators);


/* A button for showing/hiding annotation UI */
var button = ui.ActionButton({
    id: "annotate-button",
    label: "Annotation Tool",
    icon: "./icons/portia-64.png",
    onClick: function(state) {
        var tab = tabs.activeTab;
        console.log("tabs:", tabs.length);
        console.log("current tab:", tab.id);

        var annotator = getAnnotator(tab);
        annotator.toggle();

        if (annotator.active){
            button.state("tab", {icon: "./icons/portia-64-active.png"});
        }
        else{
            button.state("tab", {icon: "./icons/portia-64.png"});
        }
        sidebar.update();
    }
});


/*
A shortcut: os OS X press CMD+E to activate the UI.
*/
var toggleUIhotkey = Hotkey({
    combo: "accel-e",
    onPress: function(){
        button.click();
    }
});


// for debugging - go to some initial url
tabs.activeTab.url = "http://stackoverflow.com/questions/29268299/difference-between-oracle-client-and-odac";


// handle fortia: links
protocol.events.on("newChannel", function (parsed) {
    console.log("newChannel", parsed);
    button.click();
    // TODO: click only when page is loaded
});
