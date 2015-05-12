/*
Sidebar JSX (React) code
*/

var template = {
    key: null,
    fields: []
};

if (addon.mocked){
    template = {
        key: "-3-2",
        fields: [
            {name: "title", prevName: "title", editing: false, id: "asdfhg34"},
            {name: "score", prevName: "score", editing: false, id: "876hlkjb"},
        ]
    };
}


const update = React.addons.update;

/*
Actions for interacting with the main addon code.

This is a Flux ActionCreator, with a twist: Dispatcher is not called directly
because it is not available in Sidebar context.
*/
SidebarActions = function (templateId) {
    this.templateId = templateId;
    this.emit = (action, data) => {
        //console.log("SidebarAction", this.templateId, action, data);
        addon.port.emit("SidebarAction", this.templateId, action, data);
    }
};

SidebarActions.prototype = {
    saveTemplateAs: function () {
        this.emit("saveTemplateAs");
    },

    notifyHovered: function (fieldId) {
        this.emit("field:hovered", {fieldId: fieldId});
    },

    notifyUnhovered: function (fieldId) {
        this.emit("field:unhovered", {fieldId: fieldId});
    },

    renameField: function (fieldId, newName, isFinal) {
        this.emit("renameField", {fieldId: fieldId, newName: newName, isFinal: isFinal});
    },

    startEditing: function (fieldId, closeIds) {
        this.emit("startEditing", {fieldId: fieldId, closeIds: closeIds});
    },

    removeField: function (fieldId) {
        this.emit("removeField", {fieldId: fieldId});
    }
};


// use this.props method, but don't pass an event to it.
function useProps(name){
    return function (ev) {
        ev.preventDefault();
        this.props[name]();
    }
}


var Icon = React.createClass({
    render: function () {
        return <span className={"glyphicon glyphicon-" + this.props.name}/>;
    }
});


var EmptyMessage = React.createClass({
    render: function(){
        return (
            <p>
                You haven't annotated any items yet.
                Click on the elements you want to extract from the web page &nbsp;
                <Icon name="arrow-right"/>
            </p>
        );
    }
});


var BootstrapListGroup = React.createClass({
    render: function () {
        var items = this.props.children.map(function (item) {
            return (
                <li className="list-group-item"
                    key={item.key}
                    onMouseEnter={item.props.onMouseEnter}
                    onMouseLeave={item.props.onMouseLeave}>
                    {item}
                </li>
            );
        });
        return <ul className="list-group">{items}</ul>;
    }
});


var BootstrapButtonRow = React.createClass({
    render: function(){
        return (
            <div className="row">
                <div className="btn-block">
                    <div className="col-xs-12">
                        {this.props.children}
                    </div>
                </div>
            </div>
        );
    }
});



/* "Finish" button with a dropdown */
var FinishButtons = React.createClass({
    onSaveAs: useProps("onSaveAs"),
    onCancel: useProps("onCancel"),
    onHelp: useProps("onHelp"),

    render: function () {
        return (
            <BootstrapButtonRow>
                <a role="button" className="btn btn-info col-xs-9">Finish</a>
                <div>
                    <a role="button" className="btn btn-primary dropdown-toggle" data-toggle="dropdown">
                        <Icon name="menu-hamburger"/>
                    </a>
                    <ul className="dropdown-menu dropdown-menu-right" role="menu">
                        <li>
                            <a href="#" onClick={this.onSaveAs}>
                                <Icon name="save"/>&nbsp; Save to a local file..
                            </a>
                        </li>
                        <li>
                            <a href="#" onClick={this.onCancel}>
                                <Icon name="remove"/>&nbsp; Cancel annotation
                            </a>
                        </li>
                        <li>
                            <a href="#" onClick={this.onHelp}>
                                <Icon name="book"/>&nbsp; Help
                            </a>
                        </li>
                    </ul>
                </div>
            </BootstrapButtonRow>
        )
    }
});


/* "Save As" button */
var SaveAsButton = React.createClass({
    onSaveAs: useProps("onSaveAs"),
    onCancel: useProps("onCancel"),
    onHelp: useProps("onHelp"),

    render: function () {
        return (
            <BootstrapButtonRow>
                <a role="button" className="btn btn-info col-xs-9" onClick={this.onSaveAs}>Save as..</a>
                <div>
                    <a role="button" className="btn btn-primary dropdown-toggle" data-toggle="dropdown">
                        <Icon name="menu-hamburger"/>
                    </a>
                    <ul className="dropdown-menu dropdown-menu-right" role="menu">
                        <li>
                            <a href="#" onClick={this.onCancel}>
                                <Icon name="remove"/>&nbsp; Cancel annotation
                            </a>
                        </li>
                        <li>
                            <a href="#" onClick={this.onHelp}>
                                <Icon name="book"/>&nbsp; Help
                            </a>
                        </li>
                    </ul>
                </div>
            </BootstrapButtonRow>
        )
    }
});


var FieldDisplay = React.createClass({
    onClick: useProps("onClick"),
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
                       className="form-control" autoFocus placeholder="field name"
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
                            <Icon name="ok"/>&nbsp;&nbsp;Save
                        </a></li>
                        <li><a href="#" onClick={this.onReset}>
                            <Icon name="repeat"/>&nbsp;&nbsp;Cancel
                        </a></li>
                        <li><a href="#" onClick={this.onRemove}>
                            <Icon name="remove"/>
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
            var onRemove = this.props.onFieldRemove.bind(null, i);
            var onEnter = this.props.onFieldMouseEnter.bind(null, i);
            var onLeave = this.props.onFieldMouseLeave.bind(null, i);
            var showEditor = this.props.showEditorByIndex.bind(null, i);
            var onSubmit = this.props.onFieldSubmit.bind(null, i);
            var onChange = this.props.onFieldChange.bind(null, i);

            if (!field.editing) {
                return <FieldDisplay name={field.name} ref={ref} key={field.id}
                                  onClick={showEditor}
                                  onMouseEnter={onEnter}
                                  onMouseLeave={onLeave} />;
            }
            else {
                return <FieldEdit name={field.name} prevName={field.prevName}
                                  ref={ref}
                                  key={field.id}
                                  validate={validate}
                                  onSubmit={onSubmit}
                                  onChange={onChange}
                                  onRemove={onRemove}
                                  onMouseEnter={onEnter}
                                  onMouseLeave={onLeave} />;
            }
        });

        if (this.props.useFinish){
            var buttons = <FinishButtons
                               onSaveAs={this.props.onSaveAs}
                               onCancel={this.props.onCancelAnnotation}
                               onHelp={this.props.onHelp} />;
        }
        else {
            var buttons = <SaveAsButton
                               onSaveAs={this.props.onSaveAs}
                               onCancel={this.props.onCancelAnnotation}
                               onHelp={this.props.onHelp} />;
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
        return {template: template};
    },

    componentWillUpdate: function (nextProps, nextState) {
        this.actions = new SidebarActions(nextState.template.key);
    },

    componentDidMount: function () {
        this.actions = new SidebarActions(this.state.template.key);
        addon.port.emit("sidebar:ready");

        addon.port.on("template:changed", (template) => {
            this.setState({template: template});
        });
    },

    _fieldsToClose: function () {
        return this.state.template.fields.filter((field, i) => {
            return field.editing && this.refs.editor.fieldOk(i);
        })
    },

    showEditorByIndex: function (index) {
        var fieldId = this.state.template.fields[index].id;
        var closeIds = this._fieldsToClose().map(field => field.id);
        console.log("showEditorByIndex", index, fieldId, closeIds);
        this.actions.startEditing(fieldId, closeIds);
    },

    onSaveAs: function () {
        this.actions.saveTemplateAs();
    },

    onCancelAnnotation: function () {
        alert("Sorry, this feature is not implemented yet.");
        /*
        if (confirm("Are you sure? The current annotation will be discarded.")) {
            this.removeTemplate(id, () => {
                addon.port.emit("template:remove", id);
            });
        }
        */
    },

    onHelp: function () {
        alert("Sorry, help is not ready yet.")
    },

    render: function () {
        var tpl= this.state.template;
        if (!tpl){
            return <div><FortiaHeader/><NoTemplate delay={200} /></div>;
        }

        var onEnter = (index, ev) => {
            this.actions.notifyHovered(tpl.fields[index].id);
        };

        var onLeave = (index, ev) => {
            this.actions.notifyUnhovered(tpl.fields[index].id);
        };

        var onFieldSubmit = (index, name) => {
            this.actions.renameField(tpl.fields[index].id, name, true);
        };

        var onFieldChange = (index, name) => {
            this.actions.renameField(tpl.fields[index].id, name, false);
        };

        var onFieldRemove = (index) => {
            this.actions.removeField(tpl.fields[index].id);
        };

        return (
            <div>
                <FortiaHeader />
                <TemplateEditor ref="editor" key={tpl.key} fields={tpl.fields}
                                onFieldMouseEnter={onEnter}
                                onFieldMouseLeave={onLeave}
                                onFieldSubmit={onFieldSubmit}
                                onFieldChange={onFieldChange}
                                onFieldRemove={onFieldRemove}
                                showEditorByIndex={this.showEditorByIndex}
                                onCancelAnnotation={this.onCancelAnnotation}
                                onSaveAs={this.onSaveAs}
                                onHelp={this.onHelp}
                                useFinish={false}
                />
            </div>
        );
    }
});

React.render(<Sidebar/>, document.getElementById('content'));
