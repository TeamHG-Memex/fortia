/*
Content script with annotation UI.
*/

"use strict";
var $ = jQuery.noConflict(true);



/*
A widget which highlights HTML element under cursor and emits a "click" event
when the element is clicked.
*/
function ElementSelector(overlay, outlineOptions) {
    this.currentElement = null;
    this.overlay = overlay;
    this.canvas = overlay.canvas;
    this.outline = new Outline(this.canvas, outlineOptions);

    this.onMouseOver = (event) => {
        var elem = event.target;
        if (elem == this.currentElement) {
            return;
        }
        this.outline.trackElem(elem);
        if (this.currentElement){
            $(this.currentElement).off("click", this.onClick);
        }
        $(elem).on("click", this.onClick);
        this.currentElement = elem;
    };

    this.onClick = (event) => {
        var elem = event.target;
        this.emit("click", elem);
        event.stopPropagation();
        event.preventDefault();
        console.log("clicked", elem.tagName);
    };

    this.onOverlayResize = () => {this.outline.update()};
    this.overlay.on("resize", this.onOverlayResize);
    $("*").on("mouseover", this.onMouseOver);
}

ElementSelector.prototype = {
    destroy: function(){
        console.log("ElementSelector.destroy");

        if (this.currentElement){
            $(this.currentElement).off("click", this.onClick);
        }
        this.overlay.off("resize", this.onOverlayResize);
        $("*").off("mouseover", this.onMouseOver);
        this.outline.destroy();
        delete this.outline;
    },
};
Minivents(ElementSelector.prototype);


/* Annotator */
function Annotator() {
    console.log("creating Annotator");
    this.overlay = new CanvasOverlay();
    this.selector = new ElementSelector(this.overlay);

    this.selector.on("click", function(elem){
        var data = JSON.stringify({"annotations": {"content": "field1"}});
        $(elem).attr("data-scrapy-annotate", data);
    })
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
    getTemplate: function(){
        return document.innerHtml;
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
    self.port.emit("annotator-ready");
});

self.port.on("deactivate", function () {
    if (annotator){
        console.log("destroy-annotator");
        annotator.destroy();
        annotator = null;
    }
});

