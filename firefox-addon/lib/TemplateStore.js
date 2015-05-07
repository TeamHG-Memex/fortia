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

    renameField: function (templateId, oldName, newName) {
        this.get(templateId).fields.forEach((field) => {
            if (field.name == oldName){
                field.name = newName;
            }
        });
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
    switch (payload.action) {
        case "createField":
            var templateId = data.templateId;
            var newField = TemplateStore.createField(templateId);
            TemplateStore.emitChanged(templateId);
            TemplateStore.emit("fieldCreated", templateId, {
                field: newField,
                selector: data.selector
            });
            break;
        case "createTemplate":
            var templateId = data.templateId;
            if (TemplateStore.createTemplate(templateId)) {
                TemplateStore.emitChanged(templateId);
            }
            break;
        case "renameField":
            var templateId = data.templateId;
            var oldName = data.oldName;
            var newName = data.newName;
            TemplateStore.renameField(templateId, oldName, newName);
            TemplateStore.emitChanged(templateId);
            TemplateStore.emit("fieldRenamed", templateId, {
                oldName: oldName,
                newName: newName,
            });
            break;
    }
});


TemplateStore.on("changed", function (templateId, template) {
    console.log("TemplateStore changed", templateId, template);
});


exports.TemplateStore = TemplateStore;
