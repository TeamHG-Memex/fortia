/*
A canvas-backed rectangle which follows a DOM element
*/
function Outline(canvas, options) {
    this.elem = null;
    this.canvas = canvas;
    this.opts = {
        pad: 4,
        fillColor: "#EAE7D6",
        fillColorAlpha: 0.2,
        strokeColor: "#24C2CB",
        strokeWidth: 2,
        roundRadius: 4,
    };
    this.rect = new fabric.Rect();
    this.update(options);  // it updates this.opts if needed
    this.canvas.add(this.rect);
}

Outline.prototype = {
    updateStyle: function (options) {
        this.opts = Object.assign(this.opts, options);

        var fillColor = fabric.Color.fromHex(this.opts.fillColor);
        fillColor.setAlpha(this.opts.fillColorAlpha);

        this.rect.set({
            fill: fillColor.toRgba(),
            strokeWidth: this.opts.strokeWidth,
            stroke: this.opts.strokeColor,
            rx: this.opts.roundRadius,
            ry: this.opts.roundRadius,
        });
    },

    updatePosition: function () {
        if (!this.elem){
            this.rect.set({visible: false});
            return;
        }
        var bbox = this.elem.getBoundingClientRect();
        var pad = this.opts.pad;
        var strokeWidth = this.opts.strokeWidth;

        this.rect.set({
            visible: true,
            left: bbox.left + window.scrollX - pad,
            top: bbox.top + window.scrollY - pad,
            width: bbox.width + pad*2 - strokeWidth,
            height: bbox.height + pad*2 - strokeWidth,
        })
    },

    trackElem: function(elem) {
        if (elem === this.elem){
            return;
        }
        this.elem = elem;
        this.update();
    },

    update: function(options) {
        this.updateStyle(options);
        this.updatePosition();
        this.canvas.renderAll();
    },

    destroy: function() {
        console.log("Outline.destroy");
        this.canvas.remove(this.rect);
    }
};
