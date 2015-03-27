/*
A widget which highlights HTML element under cursor and emits a "click" event
when the element is clicked.
*/
function ElementSelector(overlay, outlineOptions) {
    this.currentElement = null;
    this.overlay = overlay;
    this.canvas = overlay.canvas;
    this.outline = new ElementOutline(this.canvas, outlineOptions);
    this.cursor = "pointer"; // "cell"

    this.onMouseOver = (event) => {
        var elem = event.target;
        if (elem == this.currentElement) {
            return;
        }
        this._restoreElement();

        this.outline.trackElem(elem);
        this.currentElement = elem;
        $(elem).on("click", this.onClick).css({cursor: this.cursor});
    };

    this.onClick = (event) => {
        var elem = event.target;
        this.emit("click", elem);
        event.stopPropagation();
        event.preventDefault();
        console.log("clicked", elem.tagName);
    };

    this.onOverlayResize = () => {this.outline.update()};
    this.overlay.on("resize", this.onOverlayResize);
    $("*").on("mouseover", this.onMouseOver);
}

ElementSelector.prototype = {

    /* remove all DOM elements and event handlers for this ElementSelector */
    destroy: function(){
        console.log("ElementSelector.destroy");
        this._restoreElement();
        this.overlay.off("resize", this.onOverlayResize);
        $("*").off("mouseover", this.onMouseOver);
        this.outline.destroy();
        delete this.outline;
    },

    /* restore currently tracked element to its original state */
    _restoreElement: function () {
        if (!this.currentElement) {
            return;
        }
        $(this.currentElement).off("click", this.onClick).css({cursor: ""});
    }
};

/* enable .on, .off and .emit events for ElementSelector */
Minivents(ElementSelector.prototype);
