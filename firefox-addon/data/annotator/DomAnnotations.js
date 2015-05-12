/*
An object for maintaining a list of annotations.

Data is stored in HTML attributes:

- `data-scrapy-id` contains an unique `id` for this annotation;
- `data-scrapy-annotate` contains JSON-encoded object
  {"annotations": {"htmlAttributeName": "fieldName"}}
  "content" or "text-content" is a special value for "htmlAttributeName"
  which means "get the text contents". Multiple attributes are allowed
  by scrapely.

In addition to "annotations" Scrapely supports other keys
in `data-scrapy-annotate`:

- "required";
- "variant";
- "generated".

They are not supported by this UI yet.

Scrapely also supports other optional attributes;
they are also not handled here yet:

- `data-scrapy-ignore`;
- `data-scrapy-ignore-beneath`;
- `data-scrapy-replacement`;

*/
function DomAnnotations(){
    this.loadFromDOM();
}

DomAnnotations.prototype = {
    /* Get element's annotation ID */
    getId: function (elem) {
        return $(elem).attr("data-scrapy-id");
    },

    /* Return true if there is an annotation for elem */
    exist: function (elem) {
        return !!this.getId(elem);
    },

    /* Set element's annotation ID */
    setId: function (elem, id) {
        $(elem).attr("data-scrapy-id", id);
    },

    /* Return HTML element by its annotation ID */
    byId: function (id) {
        return $("[data-scrapy-id="+id+"]");
    },

    /* Get annotation data stored for DOM element */
    getData: function(elem){
        var data = $(elem).attr("data-scrapy-annotate");
        if (data) {
            return JSON.parse(data);
        }
    },

    /* Store annotation data in a DOM element */
    setData: function (elem, data) {
        return $(elem).attr("data-scrapy-annotate", JSON.stringify(data));
    },

    /* Return a list of all linked field names */
    linkedFields: function (elem) {
        var ann = this.getData(elem).annotations;
        return Object.keys(ann).map((attr) => ann[attr]);
    },

    /* Remove all annotations from a DOM element */
    removeAnnotations: function (elem) {
        $(elem).attr("data-scrapy-annotate", null);
        $(elem).attr("data-scrapy-id", null);
    },

    /* Get all annotated DOM elements */
    allElements: function () {
        return $("[data-scrapy-annotate]");
    },

    /* Add a new annotation. */
    add: function (elem, fieldName, fieldId, attr) {
        attr = attr || "content";
        this.setId(elem, fieldId);
        var data = {annotations: {[attr]: fieldName}};
        this.setData(elem, data).blur();
        this.emit("added", {fieldId: fieldId, data: data});
    },

    /* Rename a field */
    rename: function (fieldId, newName) {
        // FIXME: id should be per-attribute, not per-element.
        // currently multiple attributes are not supported.
        var elem = this.byId(fieldId);
        var data = this.getData(elem);
        var annotations = data.annotations;
        for (let attr of Object.keys(annotations)) {
            annotations[attr] = newName;
        }
        this.setData(elem, data);
        this.emit("renamed", {fieldId: fieldId, newName: newName});
    },

    /* Remove all annotations for the field */
    removeField: function (fieldId) {
        // FIXME: id should be per-attribute, not per-element.
        // currently multiple attributes are not supported.
        var elem = this.byId(fieldId);
        this.removeAnnotations(elem);
        this.emit("removed", {fieldId: fieldId});
    },

    /* get a list of annotations from DOM */
    loadFromDOM: function () {
        // TODO
    },
};

/* enable .on, .off and .emit methods for DomAnnotations */
Minivents(DomAnnotations.prototype);

