/*
Flux Store for annotation templates.
*/
const { on, once, off, emit } = require('sdk/event/core');
const { AppDispatcher } = require("./dispatcher.js");
const { getRandomString } = require("./utils.js");
const { Log } = require("./Log.js");

var log = Log("TemplateStore");

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
            editing: false,
            valid: true,
            id: fieldId
        };
        this.get(templateId).fields.push(newField);
        this.validate(templateId);
        return newField;
    },

    renameField: function (templateId, fieldId, newName, isFinal) {
        var fields = this.get(templateId).fields.filter(field => field.id == fieldId);
        fields.forEach(field => {field.name = newName});
        this.validate(templateId);

        if (isFinal){
            // commit all valid fields
            fields.filter(field => field.valid).forEach(field => {
                field.prevName = newName;
                field.editing = false;
            });
        }
    },

    /*
    * try to close all editors
    * */
    confirmFields: function (templateId) {
        this.get(templateId).fields.forEach(field => {
            if (field.valid) {
                field.prevName = field.name;
                field.editing = false;
            }
        });
    },

    startEditing: function (templateId, fieldId) {
        this.confirmFields(templateId);
        this.get(templateId).fields.forEach(field => {
            if (field.id == fieldId){
                field.prevName = field.name;
                field.editing = true;
            }
        });
    },

    removeField: function (templateId, fieldId) {
        var tpl = this.get(templateId);
        tpl.fields = tpl.fields.filter(field => field.id != fieldId);
        this.validate(templateId);
    },

    _suggestFieldName: function (templateId) {
        var nextId = this.nextId[templateId] || 1;
        this.nextId[templateId] = nextId + 1;
        return "field" + nextId;
    },

    /*
    * set field.valid attribute for all fields with editing=true
    * */
    validate: function (templateId) {
        var fields = this.get(templateId).fields;
        var names = {};
        fields.forEach(field => {
            names[field.name] = names[field.name] || [];
            names[field.name].push(field.id);
        });
        fields.filter(field => field.editing).forEach(field => {
            field.valid = names[field.name].length == 1 && field.name.trim() != "";
        });
    }
};


AppDispatcher.register(function(payload) {
    log("AppDispatcher payload", payload);
    var data = payload.data;
    if (!data) {
        return;
    }
    var templateId = data.templateId;
    switch (payload.action) {
        case "deleteTemplate":
            TemplateStore.deleteTemplate(templateId);
            break;
        case "createTemplate":
            if (TemplateStore.createTemplate(templateId)) {
                TemplateStore.emitChanged(templateId);
            }
            break;
        case "createField":
            var newField = TemplateStore.createField(templateId);
            TemplateStore.startEditing(templateId, newField.id);
            TemplateStore.emitChanged(templateId);
            TemplateStore.emit("fieldCreated", templateId, {
                field: newField,
                selector: data.selector
            });
            break;
        case "renameField":
            TemplateStore.renameField(templateId, data.fieldId, data.newName, data.isFinal);
            TemplateStore.emitChanged(templateId);
            TemplateStore.emit("fieldRenamed", templateId, {
                fieldId: data.fieldId,
                newName: data.newName
            });
            break;
        case "startEditing":
            TemplateStore.startEditing(templateId, data.fieldId);
            TemplateStore.emitChanged(templateId);
            break;
        case "removeField":
            TemplateStore.removeField(templateId, data.fieldId);
            TemplateStore.emitChanged(templateId);
            TemplateStore.emit("fieldRemoved", templateId, {fieldId: data.fieldId});
            break;
    }
});


TemplateStore.on("changed", function (templateId, template) {
    log("changed", templateId, template);
});

/*
TemplateStore.on("fieldRenamed", function (templateId, data) {
    log("TemplateStore fieldRenamed", templateId, data);
});
*/

exports.TemplateStore = TemplateStore;
