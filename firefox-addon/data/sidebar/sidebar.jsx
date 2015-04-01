/*
Sidebar JSX (React) code
*/

var fields = [];
if (addon.mocked){
    fields = [
        {name: "title"},
        {name: "score"},
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
            return <li className="list-group-item">{item}</li>
        });
        return <ul className="list-group">{items}</ul>;
    }
});


var FieldDisplay = React.createClass({
    render: function () {
        return (
            <div onClick={this.props.onClick}>
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
    onSubmit: function (ev) {
        ev.preventDefault();
        if (this.state.ok){
            console.log("field value changed");
            this.props.onSubmit(this.refs.nameInput.getDOMNode().value.trim());
        }
        else {
            this.focus();
        }
    },
    onReset: function (ev) {
        ev.preventDefault();
        this.refs.nameInput.getDOMNode().value = this.props.name;
        this.props.onSubmit(this.props.name);
    },
    onRemove: function (ev) {
        ev.preventDefault();
        if (confirm("Are you sure you want to remove this field?")){
            this.props.onRemove();
        }
    },
    onInputChange: function (ev) {
        var text = ev.target.value;
        this.setState({ok: this.props.validate(text)});
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


var FieldWidget = React.createClass({
    getInitialState: function () {
        return {editing: false}
    },
    showEditor: function(){
        this.setState({editing: true}, () => {
            this.refs.editor.focus().select();
        });
    },
    onSubmit: function(newName){
        this.setState({editing: false});
        this.props.onChange({name: newName});
    },
    onRemove: function () {
        this.setState({editing: false});
        this.props.onRemove();
    },
    render: function () {
        var name = this.props.field.name;
        if (this.state.editing){
            return <FieldEdit name={name} ref="editor"
                              onSubmit={this.onSubmit}
                              onRemove={this.onRemove}
                              validate={this.props.validate} />;
        }
        else{
            return <FieldDisplay name={name} onClick={this.showEditor} />;
        }
    }
});


var SaveTemplateAsButton = React.createClass({
    onSaveAs: function (ev) {
        addon.port.emit("template:saveas");
    },
    render: function () {
        return (
            <div className="row">
                <div className="col-xs-12">
                    <div className="btn-group btn-group-justified" role="group">
                        <a className="btn btn-default" role="button" onClick={this.onSaveAs}>Save as..</a>
                    </div>
                </div>
            </div>
        )
    }
});


var Sidebar = React.createClass({
    getInitialState: function() {
        return {fields: fields};
    },

    componentDidMount: function () {
        addon.port.on("field:add", (name) => {this.addField(name)});
        addon.port.on("field:edit", (name) => {this.showFieldEditor(name)});
    },

    addField: function(name){
        var el = {'name': name};
        var state = update(this.state, {fields: {$push: [el]}});
        this.setState(state, function(){
            var id = "field" + (this.state.fields.length-1);
            this.refs[id].showEditor();
        });
    },

    showFieldEditor: function (name) {
        var id = this.state.fields.findIndex(f => f.name == name);
        if (id != -1){
            this.refs["field"+id].showEditor();
        }
        else{
            console.error("bad field name", name, this.state.fields);
        }
    },

    onFieldChanged: function (index, changes) {
        var newFields = this.state.fields.map((field, i) => {
            return (index == i) ? _.extend({}, field, changes) : field;
        });

        var oldName = this.state.fields[index].name;
        var newName = changes.name;
        if (oldName != newName){
            addon.port.emit("field:renamed", oldName, newName);
        }

        this.setState({fields: newFields});
    },

    onFieldRemovalRequested: function (index) {
        //console.log("remove field", index);
        var field = this.state.fields[index];

        this.setState(update(this.state, {
            fields: {$splice: [[index, 1]]}      // remove fields[index]
        }));
        addon.port.emit("field:removed", field.name);
    },

    valueAllowed: function (index, text) {
        var text = text.trim();
        if (text.trim() == ""){
            return false;
        }
        var hasDuplicates = this.state.fields.some((f, i) => {
            return (f.name.trim() == text) && (i != index);
        });
        return !hasDuplicates;
    },

    render: function() {
        if (!this.state.fields.length){
            return <EmptyMessage/>;
        }
        var items = this.state.fields.map((field, i) => {
            var onChange = this.onFieldChanged.bind(this, i);
            var onRemove = this.onFieldRemovalRequested.bind(this, i);
            var validate = this.valueAllowed.bind(this, i);
            return <FieldWidget field={field} ref={"field"+i}
                                onChange={onChange}
                                onRemove={onRemove}
                                validate={validate} />;
        });

        return (
            <div>
                <BootstrapListGroup>{items}</BootstrapListGroup>
                <SaveTemplateAsButton/>
            </div>
        );
    }
});

React.render(<Sidebar/>, document.getElementById('content'));
