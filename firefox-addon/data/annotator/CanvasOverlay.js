/*
Canvas overlay object. It is drawed on top of a whole web page
and provides a fabric.js wrapper.

Optionally, it can disable all web page interactions.
*/
function CanvasOverlay(id='scrapely-overlay') {
    this.log = InstanceLog("CanvasOverlay");
    this.forcedRefreshInterval = 5000;
    this.interactionsBlocked = false;
    this._createCanvas(id);
    this._enableAutoResize();
    this.log("created");
}

CanvasOverlay.prototype = {

    /* Create <canvas> element and its fabric.js wrapper */
    _createCanvas: function(id) {
        var canvasEl = document.createElement("canvas");
        canvasEl.id = id;
        $(canvasEl).css({
            position: "absolute",
            left: 0,
            top: 0,
            "z-index": 10000000,
            'pointer-events': 'none',
        });
        this.canvasEl = canvasEl;
        this.mount();
        this.canvas = new fabric.StaticCanvas(canvasEl);
        this.canvas.backgroundColor = null;
    },

    /* add necessary nodes to DOM */
    mount: function () {
        document.body.appendChild(this.canvasEl);
    },

    /* remove all extra nodes from DOM */
    unmount: function () {
        this.canvasEl = document.body.removeChild(this.canvasEl);
    },

    /* Canvas needs to be resized when page is resized */
    _enableAutoResize: function () {
        this._resizeToWindow = () => {
            this.canvas.setHeight($(document).height());
            this.canvas.setWidth($(document).width());
            this.emit("resize");
            this.canvas.renderAll();
        };

        $(window).on('resize', this._resizeToWindow);
        this._resizeTimer = setInterval(this._resizeToWindow, this.forcedRefreshInterval);
        this._resizeToWindow();
    },

    /* remove all DOM elements and event handlers */
    destroy: function () {
        this.log("destroy");
        $(window).off('resize', this._resizeToWindow);
        clearInterval(this._resizeTimer);
        this.canvas.dispose();
        document.body.removeChild(this.canvasEl);
    },

    /* make canvas handle all mouse click events */
    blockInteractions: function(){
        this.log("blockInteractions");
        this.interactionsBlocked = true;
        $(this.canvasEl).css({
            'pointer-events': 'auto',
            'background-color': 'rgba(0,0,30,0.2)',
            'background': '-moz-radial-gradient(circle, rgba(0,0,0,0.0), rgba(0,0,0,0.6)',
        });
        this.canvas.renderAll();
    },

    /* allow click events to bypass canvas */
    unblockInteractions: function(){
        this.log("unblockInteractions");
        this.interactionsBlocked = false;
        $(this.canvasEl).css({
            'pointer-events': 'none',
            'background-color': 'rgba(0,0,0,0)',
            'background': 'rgba(0,0,0,0)',
        });
        this.canvas.renderAll();
    },
};

/* enable .on, .off and .emit methods */
Minivents(CanvasOverlay.prototype);

