var ui = require("sdk/ui");
var tabs = require("sdk/tabs");

/*
Sidebar object.
Unfinished.
*/
function AnnotationSidebar(annotators){
    this.annotators = annotators;
    this.sidebar = ui.Sidebar({
        id: 'my-sidebar',
        title: 'Fortia Sidebar',
        url: "./sidebar/sidebar.html",
    });

    tabs.on("activate", (tab) => {
        console.log("activate tab:", tab.id);
        this.update(tab);
    });
}

AnnotationSidebar.prototype = {
    update: function(tab){
        var tab = tab || tabs.activeTab;
        var annotator = this.annotators[tab.id];
        if (!annotator || !annotator.active) {
            this.sidebar.hide();
        }
        else {
            this.sidebar.show();
        }
    }
};

exports.AnnotationSidebar = AnnotationSidebar;
