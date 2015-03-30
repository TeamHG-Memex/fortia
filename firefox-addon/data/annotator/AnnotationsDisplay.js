/* Class for displaying current annotations on Canvas overlay */

function AnnotationsDisplay(overlay, annotations) {
    this.overlay = overlay;
    this.annotations = annotations;
    this.outlines = [];
    this.outlineOptions = {
        strokeWidth: 3,
        pad: 4,
        //fillColor: "#FCFCFC",
        //fillColorAlpha: 0.2,
        //strokeColor: "#24C2CB",
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
            var outline = new ElementOutline(
                this.overlay.canvas,
                this.outlineOptions
            );
            outline.trackElem(elem);
            return outline;
        }));
    },

    destroy: function(){
        this.clear();
    }
};


