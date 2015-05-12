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

    self.port.on("fieldCreated", (data) => {
        var elem = $(data.selector);
        this.annotations.add(elem, data.field.name, data.field.id);
    });

    self.port.on("fieldRenamed", (data) => {
        this.annotations.rename(data.fieldId, data.newName);
    });

    self.port.on("fieldRemoved", (data) => {
        this.annotations.removeField(data.fieldId);
    });

    self.port.on("highlightField", (data) => {
        this.annotationsDisplay.addSticky(data.fieldId);
    });

    self.port.on("unhighlightField", (data) => {
        this.annotationsDisplay.removeSticky(data.fieldId);
    });

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
    lock: function () {
        this.overlay.blockInteractions();
    },
    unlock: function () {
        this.overlay.unblockInteractions();
        this.annotationsDisplay.updateAll();
    }
};


/* A component for annotating new item fields */
function FieldAnnotator(overlay, annotations) {
    console.log("creating FieldAnnotator");
    this.overlay = overlay;
    this.selector = new ElementSelector(this.overlay);

    this.onClick = (elem) => {
        if (!annotations.exist(elem)){
            // An element which wasn't previously annotated - create
            // a new annotation for it:
            // 1. mapped attribute is 'content';
            // 2. generate a field name and ask user to change it.
            console.log("FieldAnnotator.onClick create");
            AnnotatorActions.createField(elem);
            // field is actually created in a fieldCreated event handler
        }
        else {
            // user clicked on the existing annotation - start editing it
            /*
            console.log("FieldAnnotator edit");
            $(elem).blur();
            annotations.linkedFields(elem).forEach((name) => {
                self.port.emit("field:edit", name);
            });
            */
        }
    };

    this.selector.on("click", this.onClick);
}


FieldAnnotator.prototype = {

    destroy: function() {
        this.selector.off("click", this.onClick);
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
