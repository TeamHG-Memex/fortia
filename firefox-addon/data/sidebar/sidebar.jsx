/*
Sidebar JSX (React) code
*/

var templates = [];
var activeTemplateId = null;
if (addon.mocked){
    activeTemplateId = '-3-2';
    templates = [
        {
            key: activeTemplateId,
            fields: [
                {name: "title", prevName: "title", editing: false},
                {name: "score", prevName: "score", editing: false},
            ]
        }
    ];
}


const update = React.addons.update;


var EmptyMessage = React.createClass({
    render: function(){
        return (
            <p>
                You haven't annotated any items yet.
                Click on the elements you want to extract from the web page &nbsp;
                <span className="glyphicon glyphicon-arrow-right"></span>
            </p>
        );
    }
});


var BootstrapListGroup = React.createClass({
    render: function () {
        var items = this.props.children.map(function (item) {
            return (
                <li className="list-group-item"
                    onMouseEnter={item.props.onMouseEnter}
                    onMouseLeave={item.props.onMouseLeave}>
                    {item}
                </li>
            );
        });
        return <ul className="list-group">{items}</ul>;
    }
});


/* "Finish" button with a dropdown */
var FinishButtons = React.createClass({
    onSaveAs: function (ev) {
        ev.preventDefault();
        this.props.onSaveAs();
    },
    render: function () {
        return (
            <div className="row">
                <div class="btn-group btn-block">
                    <div className="col-xs-12">
                        <a role="button" className="btn btn-info col-xs-9">Finish</a>
                        <div class="col-xs-3">
                            <a role="button" className="btn btn-primary dropdown-toggle" data-toggle="dropdown">
                                <span className="glyphicon glyphicon-menu-hamburger"></span>
                            </a>
                            <ul className="dropdown-menu dropdown-menu-right" role="menu">
                                <li><a href="#" onClick={this.onSaveAs}>Save as..</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
});


/* "Save As" button */
var SaveAsButton = React.createClass({
    onSaveAs: function (ev) {
        ev.preventDefault();
        this.props.onSaveAs();
    },
    render: function () {
        return (
            <div className="row">
                <div className="col-xs-12">
                    <div className="btn-group btn-group-justified">
                        <div className="btn-group" role="group">
                            <button role="button" className="btn btn-primary" onClick={this.onSaveAs}>Save as..</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
});


var FieldDisplay = React.createClass({
    onClick: function (ev) {
        this.props.onClick();  // drop all arguments
    },
    render: function () {
        return (
            <div onClick={this.onClick}>
                {this.props.name}
                <span className="glyphicon glyphicon-pencil pull-right" role="button"></span>
            </div>
        );
    }
});


var FieldEdit = React.createClass({
    getInitialState: function() {
        return {ok: this.props.validate(this.props.name)};
    },
    componentDidMount: function () {
        this.focus().select();
    },
    focus: function () {
        return $(this.refs.nameInput.getDOMNode()).focus();
    },
    getValue: function () {
        return this.refs.nameInput.getDOMNode().value.trim();
    },
    submitIfOk: function () {
        if (this.state.ok){
            this.props.onSubmit(this.getValue());
        }
        else {
            this.focus();
        }
    },
    onSubmit: function (ev) {
        ev.preventDefault();
        this.submitIfOk();
    },
    onReset: function (ev) {
        ev.preventDefault();
        this.refs.nameInput.getDOMNode().value = this.props.prevName;
        this.props.onSubmit(this.props.prevName);
    },
    onRemove: function (ev) {
        ev.preventDefault();
        if (confirm("Are you sure you want to remove this field?")){
            this.props.onRemove();
        }
    },
    onInputChange: function (ev) {
        var text = this.getValue();
        this.setState({ok: this.props.validate(text)}, () => {
            if (this.state.ok) {
                this.props.onChange(text);
            }
        });
    },
    onInputKeyDown: function (ev) {
        // Esc => cancel; Down => open the dropdown.
        if (ev.key == 'Escape') {
            this.onReset(ev);
        } else if (ev.key == 'ArrowDown') {
            ev.preventDefault();
            $(this.refs.dropdown.getDOMNode()).click();
            $(this.refs.okLink.getDOMNode()).focus();
        }
    },
    onOkKeyDown: function (ev) {
        // When user presses "Up" and the cursor is on "Save" dropdown link,
        // close the dropdown and move focus back to the input.
        if (ev.key == 'ArrowUp') {
            ev.preventDefault();
            $(this.refs.dropdown.getDOMNode()).click();
            this.focus();
        }
    },
    render: function(){
        var btnCls = "btn btn-sm dropdown-toggle btn-" + (this.state.ok ? "success": "warning");
        return (
            <form className="input-group input-group-sm" onSubmit={this.onSubmit}>

                <input type="text" ref="nameInput"
                       className="form-control" autofocus placeholder="field name"
                       onChange={this.onInputChange}
                       onKeyDown={this.onInputKeyDown}
                       defaultValue={this.props.name} />

                <span className="input-group-btn">
                    <button className={btnCls} type="button" data-toggle="dropdown" ref="dropdown">
                        <span className="caret"></span>
                        <span className="sr-only">Toggle Dropdown</span>
                    </button>
                    <ul className="dropdown-menu dropdown-menu-right" role="menu">
                        <li><a href="#" onClick={this.onSubmit} onKeyDown={this.onOkKeyDown} ref="okLink">
                            <span className="glyphicon glyphicon-ok"></span>
                            &nbsp;&nbsp;Save
                        </a></li>
                        <li><a href="#" onClick={this.onReset}>
                            <span className="glyphicon glyphicon-repeat"></span>
                            &nbsp;&nbsp;Cancel
                        </a></li>
                        <li><a href="#" onClick={this.onRemove}>
                            <span className="glyphicon glyphicon-remove"></span>
                            <span className="text-danger">&nbsp;&nbsp;Remove</span>
                        </a></li>
                    </ul>
                </span>

            </form>
        );
    }
});


var TemplateEditor = React.createClass({
    fieldOk: function (i) {
        return this.refs['field' + i].state.ok;
    },

    valueAllowed: function (index, text) {
        var text = text.trim();
        if (text.trim() == ""){
            return false;
        }
        var hasDuplicates = this.props.fields.some((f, i) => {
            return (f.name.trim() == text) && (i != index);
        });
        return !hasDuplicates;
    },

    render: function() {
        if (!this.props.fields.length){
            return <div className="container"><EmptyMessage/></div>;
        }
        var items = this.props.fields.map((field, i) => {
            var ref = "field" + i;
            var validate = this.valueAllowed.bind(this, i);
            var onRemove = this.props.onFieldRemove.bind(this, i);
            var onEnter = this.props.onFieldMouseEnter.bind(this, i);
            var onLeave = this.props.onFieldMouseLeave.bind(this, i);
            var showEditor = this.props.showEditorByIndex.bind(this, i);
            var onSubmit = this.props.onFieldSubmit.bind(this, i);
            var onChange = this.props.onFieldChange.bind(this, i);

            if (!field.editing) {
                return <FieldDisplay name={field.name} ref={ref}
                                  onClick={showEditor}
                                  onMouseEnter={onEnter}
                                  onMouseLeave={onLeave} />;
            }
            else {
                return <FieldEdit name={field.name} prevName={field.prevName} ref={ref}
                                  validate={validate}
                                  onSubmit={onSubmit}
                                  onChange={onChange}
                                  onRemove={onRemove}
                                  onMouseEnter={onEnter}
                                  onMouseLeave={onLeave} />;
            }
        });

        if (this.props.useFinish){
            var buttons = <FinishButtons onSaveAs={this.props.onSaveAs} />;
        }
        else {
            var buttons = <SaveAsButton onSaveAs={this.props.onSaveAs} />
        }

        return (
            <div className="container">
                <BootstrapListGroup>{items}</BootstrapListGroup>
                {buttons}
            </div>
        );
    }
});


var FortiaHeader = React.createClass({
    render: function () {
        return (
            <nav className="navbar navbar-default navbar-static-top">
                <div className="container">
                    <div className="navbar-header pull-left">
                        <span className="navbar-brand">Fortia</span>
                    </div>
                </div>
            </nav>
        )
    }
});


var NoTemplate = React.createClass({
    getInitialState: function () {
        return {danger: false, timer: null};
    },
    componentDidMount: function () {
        var timer = setTimeout(() => {this.setState({danger: true})}, this.props.delay);
        this.setState({timer: timer});
    },
    componentWillUnmount: function () {
        if (this.state.timer){
            clearTimeout(this.state.timer);
        }
    },
    render: function () {
        if (!this.state.danger){
            return <div></div>;
        }
        return (
            <div className="alert alert-danger container">
            Error: no templates selected.
            </div>
        );
    }
});


var Sidebar = React.createClass({
    getInitialState: function() {
        console.log("Sidebar.getInitialState()");
        return {
            templates: templates,
            activeTemplateId: activeTemplateId
        };
    },

    componentDidMount: function () {
        addon.port.emit("sidebar:ready");

        addon.port.on("template:activate", (id) => {this.activateTemplate(id)});
        addon.port.on("field:add", (id, name) => {this.addField(id, name)});
        addon.port.on("field:edit", (id, name) => {this.showEditorByName(id, name)});
        addon.port.on("state:get", () => {addon.port.emit('sidebar:state', this.state)});
        addon.port.on("state:set", (state) => {
            this.replaceState(state, () => {
                addon.port.emit("sidebar:state-updated");
            })
        });
    },

    addField: function(id, name, callback){
        this.confirmAll(id, () => {
            this.updateTemplate(id, tpl => {
                var field = {name: name, prevName: name, editing: true};
                return update(tpl, {fields: {$push: [field]}});
            }, callback);
        });
    },

    getUpdatedTemplates: function(id, process) {
        return this.state.templates.map(tpl => {
            if (tpl.key != id){
                return tpl;
            }
            return process(tpl);
        });
    },

    updateTemplate: function (id, process, callback) {
        this.setState({templates: this.getUpdatedTemplates(id, process)}, callback);
    },

    updateTemplateFields: function (id, process, callback) {
        this.updateTemplate(id, tpl => {
            if (tpl.key != this.state.activeTemplateId) {
                console.log('template is inactive', id);
                return tpl;
            }

            var fields = process(tpl.fields, tpl);
            return update(tpl, {fields: {$set: fields}});
        }, callback);
    },

    _updateTemplateField: function (id, index, process, callback) {
        this.updateTemplateFields(id, fields => {
            return fields.map((field, i) => {
                if (i != index){
                    return field;
                }
                return process(field, i);
            });
        }, callback);
    },

    updateTemplateField: function (id, index, changes, callback) {
        this._updateTemplateField(id, index, (field) => {
            var oldName = field.name;
            var newName = changes.name;
            if (newName && oldName != newName){
                addon.port.emit("field:renamed", oldName, newName);
            }
            return _.extend({}, field, changes)
        }, callback);
    },

    confirmAll: function (id, callback) {
        this.updateTemplateFields(id, fields => {
            return fields.map((field, i) => {
                if (!field.editing) {
                    return field;
                }

                // XXX: not clean. This assumes the current editor
                // corresponds to the template being confirmed.
                if (!this.refs.editor.fieldOk(i)) {
                    return field;
                }
                return update(field, {editing: {$set: false}});
            });
        }, callback);
    },

    showEditorByName: function (id, name) {
        var template = this.state.templates.filter(tpl => tpl.key == id)[0];
        var index = template.fields.findIndex(f => f.name == name);
        if (index != -1){
            this.showEditorByIndex(id, index);
        }
        else{
            console.error("bad field name", name, template.fields);
        }
    },

    showEditorByIndex: function (id, index, callback) {
        this.confirmAll(id, () => {
            this.updateTemplateField(id, index, {editing: true}, callback);
        });
    },

    onFieldRemove: function (id, index) {
        var removedField = null;
        this.updateTemplateFields(id, fields => {
            removedField = fields[index];
            return update(fields, {$splice: [[index, 1]]});  // remove fields[index]
        }, () => {
            addon.port.emit("field:removed", removedField.name);
        });
    },

    activateTemplate: function (id) {
        console.log('activateTemplate', id, this.state.templates);

        // add an empty template if it is not known
        var templates = this.state.templates;
        if (!this.state.templates.some(tpl => tpl.key == id)){
            templates.push({key: id, fields: []});
        }

        this.setState({activeTemplateId: id, templates: templates}, () => {
            console.log('activateTemplate done', id, this.state.templates);
        });
    },

    getActiveTemplate: function () {
        var actId = this.state.activeTemplateId;
        return this.state.templates.filter(tpl => tpl.key == actId)[0];
    },

    onSaveAs: function () {
        addon.port.emit("template:saveas");
    },

    render: function () {
        var tpl = this.getActiveTemplate() || {key: null, fields: []};
        if (!tpl){
            return <div><FortiaHeader/><NoTemplate delay={200} /></div>;
        }

        var onEnter = function (index, ev) {
            addon.port.emit("field:hovered", tpl.fields[index].name, tpl.key);
        };

        var onLeave = function (index, ev) {
            addon.port.emit("field:unhovered", tpl.fields[index].name, tpl.key);
        };

        var onFieldSubmit = (index, name) => {
            this.confirmAll(tpl.key, () => {
                var changes = {name: name, prevName: name, editing: false};
                this.updateTemplateField(tpl.key, index, changes);
            });
        };
        var onFieldChange = (index, name) => {
            this.updateTemplateField(tpl.key, index, {name: name});
        };

        var showEditorByIndex = this.showEditorByIndex.bind(this, tpl.key);
        var onFieldRemove = this.onFieldRemove.bind(this, tpl.key);

        return (
            <div>
                <FortiaHeader />
                <TemplateEditor ref="editor" key={tpl.key} fields={tpl.fields}
                                onFieldMouseEnter={onEnter}
                                onFieldMouseLeave={onLeave}
                                onFieldSubmit={onFieldSubmit}
                                onFieldChange={onFieldChange}
                                onFieldRemove={onFieldRemove}
                                showEditorByIndex={showEditorByIndex}
                                onSaveAs={this.onSaveAs}
                                useFinish={false}
                />
            </div>
        );
    }
});

React.render(<Sidebar/>, document.getElementById('content'));
