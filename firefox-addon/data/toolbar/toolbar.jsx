/* toolbar */

const React = require("react");
const port = require("./port");


var AnnotateThisPageButton = React.createClass({
    render: function () {
        return <button className="btn btn-xs btn-success" onClick={this.onClick}>
            Annotate Page &darr;
        </button>;
    },

    onClick: function () {
        port.emit("startAnnotation");
    }
});


var FinishAnnotationButtons = React.createClass({
    render: function () {
        return <span>
            <button className="btn btn-xs btn-warning" onClick={this.onCancel}>
                Cancel
            </button>
            &nbsp;
            <button className="btn btn-xs btn-info"
                    disabled={this.props.disableFinish} onClick={this.onFinish}>
                Save Template &rarr;
            </button>
        </span>;
    },

    onFinish: function () {
        port.emit("finishAnnotation");
    },

    onCancel: function () {
        port.emit("stopAnnotation");
    }
});


var Toolbar = React.createClass({

    getInitialState: function () {
        return {annotating: false};
    },

    componentDidMount: function () {
        port.on("activeAnnotation", () => {
            this.setState({annotating: true});
        });
        port.on("inactiveAnnotation", () => {
            this.setState({annotating: false});
        })
    },

    componentWillUnmount: function () {
        port.removeAllListeners("activeAnnotation");
        port.removeAllListeners("inactiveAnnotation");
    },

    render: function () {

        var leftBlock = this.state.annotating
               ? <FinishAnnotationButtons />
               : <AnnotateThisPageButton />;
        return (
            <div>
                {leftBlock}
                <span className="pull-right">
                    <a href="#" onClick={this.onSaveAsClick}
                       style={{color: "black"}} title="Save to a local file">Templates</a>
                    &nbsp;&nbsp;
                    <span className="btn-group" role="group">
                        <button type="button" className="btn btn-primary btn-xs">1</button>
                        <button type="button" className="btn btn-primary btn-xs">3</button>
                        <button type="button" className="btn btn-primary btn-xs">2</button>
                    </span>
                    &nbsp;&nbsp;
                    <button className="btn btn-xs btn-primary" onClick={this.onPreviewClick}>
                        Test &darr;
                    </button>
                    &nbsp;&nbsp;
                    <button className="btn btn-xs btn-info">Done ►</button>
                </span>
            </div>
        );
    },

    onPreviewClick: function () {
        port.emit("showPreview");
    },

    onSaveAsClick: function () {
        port.emit("saveTemplateAs")
    }
});

React.render(<Toolbar/>, document.getElementById('content'));
