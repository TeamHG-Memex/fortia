/*
Class for displaying current annotations on Canvas overlay.
*/

function AnnotationsDisplay(overlay, annotations) {
    this.overlay = overlay;
    this.annotations = annotations;
    this.sticky = {};     // field name -> true/false
    this.tempStickyId = null;
    this.outlines = [];
    this.outlineOptions = {
        strokeWidth: 2,
        pad: 4,
        strokeColor: "#59BCDE",
        fillColor: "#66D8FF",
        fillColorAlpha: 0.2,
    };
    this.highlightMode = "mouseover";  // other allowed values: "always", "never"

    var doUpdateAll = (info) => {
        this.tempStickyId = info.id;
        this.updateAll();
    };
    this.onAnnotationAdded = doUpdateAll;
    this.onAnnotationRenamed = doUpdateAll;
    this.onAnnotationRemoved = doUpdateAll;

    this.annotations.on("added", this.onAnnotationAdded);
    this.annotations.on("renamed", this.onAnnotationRenamed);
    this.annotations.on("removed", this.onAnnotationRemoved);
}

AnnotationsDisplay.prototype = {
    /* clear all outline rects */
    clear: function () {
        this.outlines.forEach((outline) => {outline.destroy()});
        this.outlines = [];
    },

    /* highlight annotations for the field `name` permanently */
    addSticky: function (name) {
        if (!this.sticky[name]){
            console.log("addSticky", name);
            this.sticky[name] = true;
            this.updateAll();
        }
        this.tempStickyId = null;
    },

    /* don't highlight annotations for the field `name` permanently */
    removeSticky: function (name) {
        if (this.sticky[name]){
            console.log("removeSticky", name);
            delete this.sticky[name];
            this.updateAll();
        }
        this.tempStickyId = null;
    },

    /* Update all elements based on current annotations */
    updateAll: function () {
        this.clear();
        this.outlines = Array.from(this.annotations.allElements().map((idx, elem) => {
            var id = this.annotations.getid(elem);
            var ann = this.annotations.getdata(elem).annotations;
            var caption = Object.keys(ann).map((attr) => {
                if (attr == "content"){
                    return ann[attr];
                }
                return attr + " → " + ann[attr];
            }).join(";");

            var isSticky = Object.keys(ann).some(attr => {
                var field = ann[attr];
                return this.sticky[field];
            });
            var mode = (id == this.tempStickyId)? "once" : this.highlightMode;
            if (isSticky) {
                mode = "always";
            }

            var outline = new ElementOutline(
                this.overlay.canvas,
                this.outlineOptions,
                " " + caption + " ",
                mode,
                "#43AC6A"
                //mode == "always"? '#F04124': "#43AC6A"
            );
            outline.trackElem(elem);
            return outline;
        }));
    },

    destroy: function(){
        this.annotations.off("added", this.onAnnotationAdded);
        this.annotations.off("renamed", this.onAnnotationRenamed);
        this.annotations.off("removed", this.onAnnotationRemoved);
        this.clear();
    }
};
