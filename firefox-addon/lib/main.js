/* Main extension entry point */

var tabs = require("sdk/tabs");
var ui = require("sdk/ui");
var { Hotkey } = require("sdk/hotkeys");
var { AnnotationSidebar } = require("./sidebar.js");
var protocol = require('./protocol.js');


/* A button for showing/hiding annotation UI */
var button = ui.ActionButton({
    id: "annotate-button",
    label: "Annotation Tool",
    icon: "./icons/portia-64.png",
});

/*
A shortcut: on OS X press CMD+E to activate the UI.
*/
var toggleUIhotkey = Hotkey({
    combo: "accel-e",
    onPress: function(){
        button.click();
    }
});


/* Main Fortia UI (a sidebar) */
var fortia = new AnnotationSidebar(button);


// for debugging - go to some initial url
// tabs.activeTab.url = "http://stackoverflow.com/questions/29268299/difference-between-oracle-client-and-odac";
// tabs.activeTab.url = "http://127.0.0.1:5000";


// handle fortia: links
protocol.events.on("newChannel", function (parsed) {
    // Firefox redirects to the new URL automatically.
    // TODO: wait for redirect before displaying the annotator.
    console.log("newChannel", parsed);
    button.click();
});
