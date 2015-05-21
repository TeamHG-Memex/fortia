/*
Panel for previewing of the extracted data.
*/

var initialData = null;
if (addon.mocked) {
    initialData = {"field1": "test1", "field2": ["test2", "test3"]};
}

var CloseButton = React.createClass({
    render: function () {
        var style = {
            position: "fixed",
            right: "0px",
            top: "0px",
            cursor: "pointer"
        };
        return (
            <a href="#" role="button" onClick={this.props.onClick} className="btn btn-link btn-lg" style={style}>
                &times;
            </a>
        );
    }
});


var Preview = React.createClass({
    getInitialState: function () {
        return {data: initialData};
    },

    componentDidMount: function () {
        addon.port.emit("ready");
        addon.port.on("data", (data) => {
            this.setState({data: data});
        });
    },

    onClose: function () {
        addon.port.emit("close");
    },

    render: function () {
        var content = <h2>Nothing to show</h2>;
        var data = this.state.data;
        if (data){
            content = <JSONTree data={data} />;
        }
        return <div>
            <CloseButton onClick={this.onClose}/>
            {content}
        </div>

    }
});

React.render(<Preview/>, document.getElementById('content'));
