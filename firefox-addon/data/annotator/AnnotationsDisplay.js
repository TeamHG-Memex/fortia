/* Class for displaying current annotations on Canvas overlay */

function AnnotationsDisplay(overlay, annotations) {
    this.overlay = overlay;
    this.annotations = annotations;
    this.outlines = [];
    this.outlineOptions = {
        strokeWidth: 2,
        pad: 4,
        strokeColor: "#59BCDE",
        fillColor: "#66D8FF",
        fillColorAlpha: 0.2,
    }
}

AnnotationsDisplay.prototype = {
    /* clear all outline rects */
    clear: function () {
        this.outlines.forEach((outline) => {outline.destroy()});
        this.outlines = [];
    },

    /* Update all elements based on current annotations */
    updateAll: function () {
        this.clear();
        this.outlines = Array.from(this.annotations.allElements().map((idx, elem) => {
            var ann = this.annotations.getdata(elem).annotations;
            var caption = Object.keys(ann).map((attr) => {
                if (attr == "content"){
                    return ann[attr];
                }
                return attr + " → " + ann[attr];
            }).join(";");
            var outline = new ElementOutline(
                this.overlay.canvas,
                this.outlineOptions,
                " " + caption + " "
            );
            outline.trackElem(elem);
            return outline;
        }));
    },

    destroy: function(){
        this.clear();
    }
};


