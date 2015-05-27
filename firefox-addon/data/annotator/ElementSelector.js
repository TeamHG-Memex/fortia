/*
A widget which highlights HTML element under cursor and emits a "click" event
when the element is clicked.
*/
function ElementSelector(overlay, outlineOptions) {
    this.log = InstanceLog("ElementSelector");
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

    this.onMouseLeave = (event) => {
        if (this.currentElement == null) {
            return;
        }
        this._restoreElement();
        this.outline.trackElem(null);
        this.currentElement = null;
    };

    this.onFocus = (event) => {
        var elem = event.target;
        this.log("onFocus", elem.tagName, getUniquePath($(elem)));
        $(elem).blur();
        return false;
    };

    this.onClick = (event) => {
        var elem = event.target;
        this.emit("click", elem);
        this.log("onClick", elem.tagName, getUniquePath($(elem)));
        event.stopPropagation();
        event.preventDefault();
    };

    this.onOverlayResize = () => {this.outline.update()};
    this.overlay.on("resize", this.onOverlayResize);
    $("*").on("mouseover", this.onMouseOver);
    $(document).on("mouseleave", this.onMouseLeave);

    // XXX: this is ugly. Is there another way to fix focus issues?
    $("*").on("focus", this.onFocus);
}

ElementSelector.prototype = {

    /* remove all DOM elements and event handlers for this ElementSelector */
    destroy: function(){
        this._restoreElement();
        this.overlay.off("resize", this.onOverlayResize);
        $("*").off("mouseover", this.onMouseOver);
        $(document).off("mouseleave", this.onMouseLeave);
        $("*").off("focus", this.onFocus);
        this.outline.destroy();
        delete this.outline;
        this.log("destroyed");
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
