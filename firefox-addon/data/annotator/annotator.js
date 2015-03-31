/*
Content script with annotation UI.
*/

/*
Main annotator object.
It creates a canvas overlay and manages annotation tools.
*/
function Annotator(){
    this.overlay = new CanvasOverlay();
    this.annotations = new DomAnnotations();
    this.annotationsDisplay = new AnnotationsDisplay(this.overlay, this.annotations);

    this.annotations.on("added", (info) => {
        self.port.emit("annotation:added", info);
    });

    self.port.on("renameField", (oldName, newName) => {
        this.annotations.rename(oldName, newName);
    });

    this.setTool(new CreateFieldAnnotator(this.overlay, this.annotations));
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
function CreateFieldAnnotator(overlay, annotations) {
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
