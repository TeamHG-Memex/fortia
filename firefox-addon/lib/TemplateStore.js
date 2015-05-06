/*
Flux Store for annotation templates.
*/
const { on, once, off, emit } = require('sdk/event/core');
const { AppDispatcher } = require("./dispatcher.js");


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
        this.templates[templateId] = {
            key: templateId,
            fields: []
        }
    },

    deleteTemplate: function (templateId) {
        delete this.templates[templateId];
        delete this.nextId[templateId];
    },

    createField: function (templateId, name) {
        if (!name) {
            name = this._suggestFieldName(templateId);
        }
        var newField = {name: name, prevName: name, editing: true};
        this.get(templateId).fields.push(newField);
        return newField;
    },

    _suggestFieldName: function (templateId) {
        var nextId = this.nextId[templateId] || 1;
        this.nextId[templateId] = nextId + 1;
        return "field" + nextId;
    }
};


AppDispatcher.register(function(payload) {
    console.log("AppDispatcher payload", payload);

    if (payload.action == "createField") {
        var id = payload.data.tabId;
        var newField = TemplateStore.createField(id);
        TemplateStore.emitChanged(id);
        TemplateStore.emit("fieldCreated", id, {
            field: newField,
            selector: payload.data.selector
        });
    } else if (payload.action == "createTemplate") {
        var id = payload.data.templateId;
        TemplateStore.createTemplate(id);
        TemplateStore.emitChanged(id);
    }
});


TemplateStore.on("changed", function (templateId, template) {
    console.log("TemplateStore changed", templateId, template);
});


exports.TemplateStore = TemplateStore;
