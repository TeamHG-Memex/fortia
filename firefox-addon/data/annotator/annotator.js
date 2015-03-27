/*
Content script with annotation UI.
*/

"use strict";

/* Return a short random string */
function getRandomString() {
    return Math.random().toString(36).substr(2);
}


/* Annotator */
function Annotator() {
    console.log("creating Annotator");
    this.overlay = new CanvasOverlay();
    this.selector = new ElementSelector(this.overlay);

    this.selector.on("click", function(elem){
        var data = JSON.stringify({
            "annotations": {
                "content": "field1",
                "id": getRandomString(),
            }
        });
        $(elem).attr("data-scrapy-annotate", data);
    });

    self.port.on("getTemplate", () => {
        self.port.emit("annotator:template", this.getTemplate());
    });
}

Annotator.prototype = {
    destroy: function(){
        this.selector.destroy();
        this.overlay.destroy();
    },
    lock: function () {
        console.log("Annotator.lock");
        this.overlay.blockInteractions();
    },
    unlock: function () {
        console.log("Annotator.unlock");
        this.overlay.unblockInteractions();
    },
    getTemplate: function() {
        this.overlay.unmount();
        var template = document.documentElement.outerHTML;
        this.overlay.mount();
        return template;
    }
};



var annotator = null;

self.port.on("lock", function () {
    if (!document.body){
        console.log("no document.body");
        return;
    }
    if (!annotator){
        annotator = new Annotator();
    }
    annotator.lock();
});

self.port.on("activate", function() {
    console.log("create-annotator");
    if (!annotator){
        annotator = new Annotator();
    }
    annotator.unlock();
    self.port.emit("annotator:ready");
});

self.port.on("deactivate", function () {
    if (annotator){
        console.log("destroy-annotator");
        annotator.destroy();
        annotator = null;
    }
});

