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
    this.nextFieldId = 1;
}

DomAnnotations.prototype = {
    /* Get element's annotation ID */
    getid: function (elem) {
        return $(elem).attr("data-scrapy-id");
    },

    /* Set element's annotation ID */
    setid: function (elem, id) {
        $(elem).attr("data-scrapy-id", id);
    },

    /* Return HTML element by its annotation ID */
    byid: function (id) {
        return $("[data-scrapy-id="+id+"]");
    },

    /* Get annotation data stored for DOM element */
    getdata: function(elem){
        var data = $(elem).attr("data-scrapy-annotate");
        if (data) {
            return JSON.parse(data);
        }
    },

    /* Store annotation data in a DOM element */
    setdata: function (elem, data) {
        return $(elem).attr("data-scrapy-annotate", JSON.stringify(data));
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
    add: function (elem, fieldName, attr="content") {
        if (!fieldName) {
            fieldName = "field" + this.nextFieldId;
            this.nextFieldId += 1;
        }
        var id = getRandomString();
        this.setid(elem, id);
        var data = {annotations: {[attr]: fieldName}};
        this.setdata(elem, data).blur();
        this.emit("added", {id: id, data: data});
    },

    /* Rename a field */
    rename: function (oldName, newName) {
        this.allElements().each((idx, elem) => {
            var data = this.getdata(elem);
            var id = this.getid(elem);
            var annotations = data.annotations;
            var renames = [];
            for (let attr of Object.keys(annotations)) {
                if (annotations[attr] == oldName){
                    annotations[attr] = newName;
                    renames.push({id: id, oldName: oldName, name: newName, attr: attr});
                }
            }
            this.setdata(elem, data);
            renames.forEach((info) => this.emit("renamed", info));
        });
    },

    /* Remove all annotations for the field */
    removeField: function (name) {
        this.allElements().each((idx, elem) => {
            var id = this.getid(elem);
            var data = this.getdata(elem);
            var annotations = data.annotations;
            var deletes = [];
            var newAnnotations = {};
            for (let attr of Object.keys(annotations)) {
                if (annotations[attr] == name) {
                    deletes.push({id: id, name: name, attr: attr});
                }
                else {
                    newAnnotations[attr] = annotations[attr];
                }
            }

            if (Object.keys(newAnnotations).length == 0){
                // all properties are removed
                this.removeAnnotations(elem);
            }
            else {
                // some properties are still present
                data.annotations = newAnnotations;
                this.setdata(elem, data);
            }

            deletes.forEach((info) => this.emit("removed", info));
        });
    },

    /* get a list of annotations from DOM */
    loadFromDOM: function () {
        // TODO
    },
};

/* enable .on, .off and .emit methods for DomAnnotations */
Minivents(DomAnnotations.prototype);

