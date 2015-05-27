/*
Class for displaying current annotations on Canvas overlay.
*/

function AnnotationsDisplay(overlay, annotations) {
    this.log = InstanceLog("AnnotationsDisplay");
    this.overlay = overlay;
    this.annotations = annotations;
    this.sticky = {};     // field id -> true/false
    this.tempStickyId = null;
    this.outlines = [];
    this.outlineOptions = {
        strokeWidth: 2,
        pad: 4,
        strokeColor: "#59BCDE",
        fillColor: "#66D8FF",
        fillColorAlpha: 0.2
    };
    this.highlightMode = "mouseover";  // other allowed values: "yes", "no"

    var doUpdateAll = (info) => {
        this.tempStickyId = info.fieldId;
        this.updateAll();
    };
    this.onAnnotationAdded = doUpdateAll;
    this.onAnnotationRenamed = doUpdateAll;
    this.onAnnotationRemoved = doUpdateAll;

    this.annotations.on("added", this.onAnnotationAdded);
    this.annotations.on("renamed", this.onAnnotationRenamed);
    this.annotations.on("removed", this.onAnnotationRemoved);

    this.onResize = () => this.updateAll();
    this.overlay.on("resize", this.onResize);
    this.log("created");
}

AnnotationsDisplay.prototype = {

    /* clear all outline rects */
    clear: function () {
        this.outlines.forEach((outline) => {outline.destroy()});
        this.outlines = [];
    },

    /* highlight annotations for the field `name` permanently */
    addSticky: function (fieldId) {
        if (!this.sticky[fieldId]){
            this.log("addSticky", fieldId);
            this.sticky[fieldId] = true;
            this.updateAll();
        }
        this.tempStickyId = null;
    },

    /* don't highlight annotations for the field `name` permanently */
    removeSticky: function (fieldId) {
        if (this.sticky[fieldId]){
            this.log("removeSticky", fieldId);
            delete this.sticky[fieldId];
            this.updateAll();
        }
        this.tempStickyId = null;
    },

    /* Update all elements based on current annotations */
    updateAll: function () {
        //this.log("updateAll");
        this.clear();
        this.outlines = Array.from(this.annotations.allElements().map((idx, elem) => {
            var fieldId = this.annotations.getId(elem);
            var ann = this.annotations.getData(elem).annotations;
            var caption = Object.keys(ann).map((attr) => {
                if (attr == "content"){
                    return ann[attr];
                }
                return attr + " → " + ann[attr];
            }).join(";");

            var isSticky = fieldId == this.tempStickyId || this.sticky[fieldId];
            var mode = isSticky ? "yes" : this.highlightMode;

            var outline = new ElementOutline(
                this.overlay.canvas,
                this.outlineOptions,
                " " + caption + " ",
                mode,
                "#43AC6A"
                //mode == "yes"? '#F04124': "#43AC6A"
            );
            outline.trackElem(elem);
            if (fieldId == this.tempStickyId) {
                var cb = () => {
                    this.tempStickyId = null;
                    outline.showCaption = "mouseover";
                    outline.off("mouseleave", cb);
                    outline.updateNow();
                };
                outline.on("mouseleave", cb);
            }
            return outline;
        }));
    },

    destroy: function(){
        this.overlay.off("resize", this.onResize);
        this.annotations.off("added", this.onAnnotationAdded);
        this.annotations.off("renamed", this.onAnnotationRenamed);
        this.annotations.off("removed", this.onAnnotationRemoved);
        this.clear();
        this.log("destroyed");
    }
};
