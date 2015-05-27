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

    startEditing: function (fieldId) {
        this.emit("startEditing", {fieldId: fieldId});
    },

    emit: function (action, data) {
        self.port.emit("AnnotatorAction", action, data);
    }
};


/*
Main annotator object.
It creates a canvas overlay and manages annotation tools.
*/
function Annotator(){
    this.log = InstanceLog("Annotator");
    this.overlay = new CanvasOverlay();
    this.annotations = new DomAnnotations();
    this.annotationsDisplay = new AnnotationsDisplay(this.overlay, this.annotations);

    this.onFieldCreated = (data) => {
        var elem = $(data.selector);
        this.annotations.add(elem, data.field.name, data.field.id);
    };

    this.onFieldRenamed = (data) => {
        this.annotations.rename(data.fieldId, data.newName);
    };

    this.onFieldRemoved = (data) => {
        this.annotations.removeField(data.fieldId);
    };

    this.onHighlightedField = (data) => {
        this.annotationsDisplay.addSticky(data.fieldId);
    };

    this.onUnhighlightedField = (data) => {
        this.annotationsDisplay.removeSticky(data.fieldId);
    };

    self.port.on("fieldCreated", this.onFieldCreated);
    self.port.on("fieldRenamed", this.onFieldRenamed);
    self.port.on("fieldRemoved", this.onFieldRemoved);
    self.port.on("highlightField", this.onHighlightedField);
    self.port.on("unhighlightField", this.onUnhighlightedField);

    this.setTool(new FieldAnnotator(this.overlay, this.annotations));
    this.log("created");
}

Annotator.prototype = {
    destroy: function () {
        self.port.removeListener("fieldCreated", this.onFieldCreated);
        self.port.removeListener("fieldRenamed", this.onFieldRenamed);
        self.port.removeListener("fieldRemoved", this.onFieldRemoved);
        self.port.removeListener("highlightField", this.onHighlightedField);
        self.port.removeListener("unhighlightField", this.onUnhighlightedField);

        this.setTool(null);
        this.annotationsDisplay.destroy();
        this.overlay.destroy();
        this.overlay = null;
        this.log("destroyed");
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
    this.log = InstanceLog("FieldAnnotator");
    this.overlay = overlay;
    this.selector = new ElementSelector(this.overlay);

    this.onClick = (elem) => {
        if (!annotations.exist(elem)){
            // An element which wasn't previously annotated - create
            // a new annotation for it:
            // 1. mapped attribute is 'content';
            // 2. generate a field name and ask user to change it.
            this.log("onClick create");
            AnnotatorActions.createField(elem);
            // field is actually created in a fieldCreated event handler
        }
        else {
            // user clicked on the existing annotation - start editing it
            this.log("onClick edit");
            var fieldId = annotations.getId(elem);
            AnnotatorActions.startEditing(fieldId);
        }
    };

    this.selector.on("click", this.onClick);
    this.log("created");
}


FieldAnnotator.prototype = {
    destroy: function() {
        this.selector.off("click", this.onClick);
        this.selector.destroy();
        this.log("destroyed");
    }
};

/* enable .on, .off and .emit methods for FieldAnnotator */
Minivents(FieldAnnotator.prototype);



var annotator = null;


self.port.on("lock", function () {
    if (!document.body){
        log("no document.body");
        return;
    }
    if (!annotator){
        annotator = new Annotator();
    }
    annotator.lock();
});

self.port.on("activate", function() {
    log("create-annotator");
    if (!annotator){
        annotator = new Annotator();
    }
    annotator.unlock();
    self.port.emit("annotator:ready");
});

self.port.on("deactivate", function () {
    if (annotator){
        log("destroy-annotator");
        annotator.destroy();
        annotator = null;
    }
});

self.port.on("getTemplate", () => {
    self.port.emit("annotator:template", annotator.getTemplate());
});

var log = InstanceLog("in-page annotator");
