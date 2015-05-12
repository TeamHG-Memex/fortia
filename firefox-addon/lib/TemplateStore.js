/*
Flux Store for annotation templates.
*/
const { on, once, off, emit } = require('sdk/event/core');
const { AppDispatcher } = require("./dispatcher.js");


/* Return a short random string */
function getRandomString() {
    return Math.random().toString(36).substr(2);
}


var TemplateStore = {
    templates: {},  // id => template
    nextId: {}, // id => next index

    // event handling wrappers
    emit: function() {
        var args = [this].concat(Array.slice(arguments));
        emit.apply(null, args);
    },

    on: function (event, callback) {
        on(this, event, callback);
    },

    off: function (event, callback) {
        off(this, event, callback);
    },

    emitChanged: function (templateId) {
        this.emit("changed", templateId, this.get(templateId));
    },

    // data handling methods
    get: function (templateId) {
        return this.templates[templateId];
    },

    createTemplate: function (templateId) {
        if (this.templates[templateId]){
            return false;
        }
        this.templates[templateId] = {
            key: templateId,
            fields: []
        };
        return true;
    },

    deleteTemplate: function (templateId) {
        delete this.templates[templateId];
        delete this.nextId[templateId];
    },

    createField: function (templateId, fieldId, name) {
        fieldId = fieldId || getRandomString();
        name = name || this._suggestFieldName(templateId);
        var newField = {
            name: name,
            prevName: name,
            editing: true,
            id: fieldId
        };
        this.get(templateId).fields.push(newField);
        return newField;
    },

    renameField: function (templateId, fieldId, newName, isFinal) {
        var changes = 0;
        this.get(templateId).fields.forEach(field => {
            if (field.id == fieldId) {
                field.name = newName;
                if (isFinal){
                    field.prevName = newName;
                    field.editing = false;
                }
                changes += 1;
            }
        });
        return changes;
    },

    confirmFields: function (templateId, fieldIds) {
        var ids = new Set(fieldIds);
        this.get(templateId).fields.forEach(field => {
            if (ids.has(field.id)) {
                field.prevName = field.name;
                field.editing = false;
            }
        });
    },

    startEditing: function (templateId, fieldId, closeIds) {
        closeIds = closeIds || [];
        this.confirmFields(templateId, closeIds);
        this.get(templateId).fields.forEach(field => {
            if (field.id == fieldId){
                field.prevName = field.name;
                field.editing = true;
            }
        })
    },

    _suggestFieldName: function (templateId) {
        var nextId = this.nextId[templateId] || 1;
        this.nextId[templateId] = nextId + 1;
        return "field" + nextId;
    }
};


AppDispatcher.register(function(payload) {
    console.log("AppDispatcher payload", payload);
    var data = payload.data;
    if (!data) {
        return;
    }
    var templateId = data.templateId;
    switch (payload.action) {
        case "createField":
            var newField = TemplateStore.createField(templateId);
            TemplateStore.emitChanged(templateId);
            TemplateStore.emit("fieldCreated", templateId, {
                field: newField,
                selector: data.selector
            });
            break;
        case "createTemplate":
            if (TemplateStore.createTemplate(templateId)) {
                TemplateStore.emitChanged(templateId);
            }
            break;
        case "renameField":
            if (TemplateStore.renameField(templateId, data.fieldId, data.newName, data.isFinal)) {
                TemplateStore.emitChanged(templateId);
                TemplateStore.emit("fieldRenamed", templateId, {
                    fieldId: data.fieldId,
                    newName: data.newName
                });
            }
            break;
        case "startEditing":
            TemplateStore.startEditing(templateId, data.fieldId, data.closeIds);
            TemplateStore.emitChanged(templateId);
            break;
    }
});


TemplateStore.on("changed", function (templateId, template) {
    console.log("TemplateStore changed", templateId, template);
});

/*
TemplateStore.on("fieldRenamed", function (templateId, data) {
    console.log("TemplateStore fieldRenamed", templateId, data);
});
*/

exports.TemplateStore = TemplateStore;
