/*
Content script with annotation UI.
*/

/*
Actions for interacting with the main addon code.
*/
AnnotatorActions = {
    createField: function (elem) {
        this.emit("createField", {
            selector: getUniquePath($(elem))
        });
    },

    emit: function (action, data) {
        self.port.emit("AnotatorAction", action, data);
    }
};


/*
Main annotator object.
It creates a canvas overlay and manages annotation tools.
*/
function Annotator(){
    this.overlay = new CanvasOverlay();
    this.annotations = new DomAnnotations();
    this.annotationsDisplay = new AnnotationsDisplay(this.overlay, this.annotations);

    self.port.on("fieldCreated", (selector, name) => {
        var elem = $(selector);
        this.annotations.add(elem, name);
    });

    /*
    self.port.on("renameField", (oldName, newName) => {
        this.annotations.rename(oldName, newName);
    });

    self.port.on("removeField", (name) => {
        this.annotations.removeField(name);
    });

    self.port.on("highlightField", (name) => {
        this.annotationsDisplay.addSticky(name);
    });

    self.port.on("unhighlightField", (name) => {
        this.annotationsDisplay.removeSticky(name);
    });
    */

    this.setTool(new FieldAnnotator(this.overlay, this.annotations));
}

Annotator.prototype = {
    destroy: function () {
        this.setTool(null);
        this.annotationsDisplay.destroy();
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


/* A component for annotating new item fields */
function FieldAnnotator(overlay, annotations) {
    console.log("creating FieldAnnotator");
    this.overlay = overlay;
    this.selector = new ElementSelector(this.overlay);

    this.selector.on("click", function(elem){
        if (!annotations.exist(elem)){
            // An element which wasn't previously annotated - create
            // a new annotation for it:
            // 1. mapped attribute is 'content';
            // 2. generate a field name and ask user to change it.
            console.log("FieldAnnotator create");
            AnnotatorActions.createField(elem);
            // field is actually created in a fieldCreated event handler
        }
        else {
            // user clicked on the existing annotation - start editing it
            console.log("FieldAnnotator edit");
            $(elem).blur();
            annotations.linkedFields(elem).forEach((name) => {
                self.port.emit("field:edit", name);
            });
        }
    });
}


FieldAnnotator.prototype = {
    destroy: function() {
        this.selector.destroy();
    }
};

/* enable .on, .off and .emit methods for FieldAnnotator */
Minivents(FieldAnnotator.prototype);



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

self.port.on("getTemplate", () => {
    self.port.emit("annotator:template", annotator.getTemplate());
});
