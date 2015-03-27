/*
Sidebar JSX (React) code
*/

var fields = [
    {name: "title", "annotations": []},
    {name: "score", "annotations": []},
];


var EmptyMessage = React.createClass({
    render: function(){
        return (
            <p>
                You haven't annotated any items yet.
                Click on the text you want to extract.
            </p>
        );
    }
});


var BootstrapListGroup = React.createClass({
    render: function () {
        var items = this.props.items.map(function (item) {
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
        $(this.refs.nameInput.getDOMNode()).focus().select();
    },
    onSubmit: function (ev) {
        ev.preventDefault();
        if (this.state.ok){
            console.log("submit");
            this.props.onSubmit(this.refs.nameInput.getDOMNode().value);
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
        var value = this.refs.nameInput.getDOMNode().value.trim();
        this.setState({ok: value != ""});
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


var Sidebar = React.createClass({
    getInitialState: function() {
        return {fields: fields};
    },
    onFieldChanged: function (index, changes) {
        var newFields = this.state.fields.map(function (field, i) {
            return (index == i) ? _.extend({}, field, changes) : field;
        }.bind(this));
        this.setState({fields: newFields});
    },
    render: function(){
        if (!this.state.fields.length){
            return <EmptyMessage/>;
        }
        var items = this.state.fields.map(function (field, i) {
            return <FieldWidget field={field} onChange={this.onFieldChanged.bind(this, i)}/>;
        }.bind(this));

        return (
            <div>
                <BootstrapListGroup items={items}/>
                <div className="row">
                    <div className="col-xs-12">
                        <div className="btn-group btn-group-justified" role="group">
                            <a className="btn btn-default" role="button">Save as..</a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
});

React.render(<Sidebar/>, document.getElementById('content'));

