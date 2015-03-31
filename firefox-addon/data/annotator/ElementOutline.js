/*
A canvas-backed rectangle which follows a DOM element.
It is drawed over fabric.js canvas.
*/
function ElementOutline(canvas, options, caption="") {
    this.elem = null;
    this.canvas = canvas;  // fabric.js StaticCanvas
    this.caption = caption || "";
    this.textHeight = 14;

    this.opts = {
        pad: 4,
        fillColor: "#FCFCFC",
        fillColorAlpha: 0.2,
        strokeColor: "#59BCDE",  // "#24C2CB",
        strokeWidth: 2,
        roundRadius: 4,
    };
    this.rect = new fabric.Rect();
    this.text = new fabric.Text(this.caption, {
        left: 16,
        top: 0,
        fontFamily: '"Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
        fontSize: this.textHeight,
        color: "#FFFFFF",
        fill: "#FFFFFF",
        textBackgroundColor: '#43AC6A',
    });
    this.group = new fabric.Group([this.rect, this.text]);

    this.update(options);  // it updates this.opts if needed
    this.canvas.add(this.group);
}

ElementOutline.prototype = {

    /* update rectangle style based on passed options */
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

    /* update rectangle position to match tracked element's position */
    updatePosition: function () {
        if (!this.elem){
            this.group.set({visible: false});
            return;
        }
        var bbox = this.elem.getBoundingClientRect();
        var pad = this.opts.pad;
        var strokeWidth = this.opts.strokeWidth;

        this.rect.set({
            top: this.textHeight - pad,
            width: bbox.width + pad*2 - strokeWidth,
            height: bbox.height + pad*2 - strokeWidth,
        });
        this.group.set({
            visible: true,
            left: bbox.left + window.scrollX - pad,
            top: bbox.top + window.scrollY - this.textHeight - pad*2,
        });
    },

    /* set DOM node to track */
    trackElem: function(elem) {
        if (elem === this.elem){
            return;
        }
        this.elem = elem;
        this.update();
    },

    /* update the rectangle */
    update: function(options) {
        this.updateStyle(options);
        this.updatePosition();
        this.canvas.renderAll();
    },

    /* remove all DOM elements and event handlers */
    destroy: function() {
        //console.log("ElementOutline.destroy");
        this.canvas.remove(this.group);
    }
};
