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
        return {ok: this.props.name != ""};
    },
    componentDidMount: function () {
        this.focus();
    },
    focus: function () {
        return $(this.refs.nameInput.getDOMNode()).focus().select();
    },
    onSubmit: function (ev) {
        ev.preventDefault();
        if (this.state.ok){
            console.log("field value changed");
            this.props.onSubmit(this.refs.nameInput.getDOMNode().value.trim());
        }
    },
    onButtonClick: function(ev) {
        if (this.state.ok){
            this.onSubmit(ev);
        }
        else {
            this.refs.nameInput.getDOMNode().value = this.props.name;
            this.onChange();
        }
    },
    onChange: function (ev) {
        this.setState({ok: ev.target.value.trim() != ""});
    },
    render: function(){
        var glyphCls = "glyphicon glyphicon-" + (this.state.ok ? "ok": "remove");
        var btnCls = "btn btn-sm btn-" + (this.state.ok ? "success": "warning");
        return (
            <form className="input-group input-group-sm" onSubmit={this.onSubmit}>
                <input type="text" className="form-control" autofocus
                       onChange={this.onChange} ref="nameInput"
                       placeholder="field name" defaultValue={this.props.name}/>
                <span className="input-group-btn">
                    <button className={btnCls} type="button" onClick={this.onButtonClick}>
                        <span className={glyphCls}></span>
                    </button>
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
        this.setState({editing: true});
    },
    onSubmit: function(newName){
        this.setState({editing: false});
        this.props.onChange({name: newName});
    },
    render: function () {
        var name = this.props.field.name;
        if (this.state.editing){
            return <FieldEdit name={name} onSubmit={this.onSubmit} />;
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
        addon.port.on("fields:add", (name) => {
            this.addField(name);
        });
    },

    addField: function(name){
        if (this.state.fields.some((v) => v.name == name)) {
            console.info("duplicate field name", name);
            return;
        }
        var el = {'name': name};
        var state = update(this.state, {fields: {$push: [el]}});
        this.setState(state, function(){
            var id = "field" + (this.state.fields.length-1);
            this.refs[id].showEditor();
        });
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

    render: function() {
        if (!this.state.fields.length){
            return <EmptyMessage/>;
        }
        var items = this.state.fields.map((field, i) => {
            var onChange = this.onFieldChanged.bind(this, i);
            return <FieldWidget field={field} ref={"field"+i} onChange={onChange} />;
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
