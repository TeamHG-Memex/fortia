/*
Content script with annotation UI.
*/

"use strict";

/* Return a short random string */
function getRandomString() {
    return Math.random().toString(36).substr(2);
}


/*
Main annotator object.
It creates a canvas overlay and manages annotation tools.
*/
function Annotator(){
    this.overlay = new CanvasOverlay();
    this.setTool(new CreateFieldAnnotator(this.overlay));
}

Annotator.prototype = {
    destroy: function () {
        this.setTool(null);
        this.overlay.destroy();
        this.overlay = null;
    },

    setTool: function (tool) {
        if (this.tool){
            this.tool.destroy();
        }
        this.tool = tool;
    },

    /* Return the current template */
    getTemplate: function() {
        this.overlay.unmount();
        var template = document.documentElement.outerHTML;
        this.overlay.mount();
        return template;
    },

    /* lock/unlock interactions */
    lock: function () {this.overlay.blockInteractions();},
    unlock: function () {this.overlay.unblockInteractions();},
};


/*
An object for maintaining a list of annotations.

Data is stored in HTML attributes:

- `data-scrapy-id` contains an unique `id` for this annotation;
- `data-scrapy-annotate` contains JSON-encoded object
  {"annotations": {"htmlAttributeName": "fieldName"}}
  "content" or "text-content" is a special value for "htmlAttributeName"
  which means "get the text contents". Multiple attributes are allowed
  by scrapely.

In addition to "annotations" Scrapely supports other keys
in `data-scrapy-annotate`:

- "required";
- "variant";
- "generated".

They are not supported by this UI yet.

Scrapely also supports other optional attributes;
they are also not handled here yet:

- `data-scrapy-ignore`;
- `data-scrapy-ignore-beneath`;
- `data-scrapy-replacement`;

*/
function Annotations(){
    this.loadFromDOM();
    this.nextFieldId = 1;
}

Annotations.prototype = {
    /* Get element's annotation ID */
    getid: function (elem) {
        return $(elem).attr("data-scrapy-id");
    },

    /* Set element's annotation ID */
    setid: function (elem, id) {
        $(elem).attr("data-scrapy-id", id);
    },

    /* Add a new annotation. */
    add: function (elem, fieldName, attr="content") {
        if (!fieldName) {
            fieldName = "field-" + this.nextFieldId;
            this.nextFieldId += 1;
        }
        var id = getRandomString();
        this.setid(elem, id);
        var data = {annotations: {[attr]: fieldName}};
        $(elem).attr("data-scrapy-annotate", JSON.stringify(data)).blur();

        this.emit("added", {id: id, data: data});
    },

    /* get a list of annotations from DOM */
    loadFromDOM: function () {
        // TODO
    },

    ///* Get annotation info for an HTML element */
    //_getElementAnnotations: function (elem) {
    //    var data = $(elem).attr("data-scrapy-annotate");
    //    if (data) {
    //        return JSON.parse(data)["annotations"];
    //    }
    //},
    //
    ///* Get annotation info by its id */
    //get: function (id) {
    //    var elem = $("[data-scrapy-id='"+id+"']");
    //    return this.getForElement(elem);
    //}

};

/* enable .on, .off and .emit methods for Annotations */
Minivents(Annotations.prototype);


/* A component for annotating new item fields */
function CreateFieldAnnotator(overlay) {
    console.log("creating CreateFieldAnnotator");
    this.overlay = overlay;
    this.selector = new ElementSelector(this.overlay);

    this.selector.on("click", function(elem){
        // If there was an existing annotation, do nothing
        // XXX: try the UI to check what should we really do here
        if (annotations.getid(elem)) {
            console.log("existing");
            return;
        }

        // An element which wasn't previously annotated - create
        // a new annotation for it:
        // 1. mapped attribute is 'content';
        // 2. generate a field name and ask user to change it.
        annotations.add(elem);
    });
}


CreateFieldAnnotator.prototype = {
    destroy: function() {this.selector.destroy();}
};

/* enable .on, .off and .emit methods for CreateFieldAnnotator */
Minivents(CreateFieldAnnotator.prototype);



var annotator = null;
var annotations = new Annotations();

annotations.on("added", function (info) {
    self.port.emit("annotation:added", info);
});


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

self.port.on("getTemplate", () => {
    self.port.emit("annotator:template", annotator.getTemplate());
});
