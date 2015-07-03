/* Job page */

var React = require("react");
var Reflux = require("reflux");
var { Link } = require('react-router');
var { Panel, Table, Button, Glyphicon, ButtonToolbar } = require("react-bootstrap");

var JobStore = require("../stores/JobStore");
var ItemStore = require("../stores/ItemStore");

var NoJobPage = React.createClass({
    render: function () {
        return (
            <div>
                <h2>Job is not found</h2>
                <p>This job is either not available or never existed.</p>
                <Link to="joblist">
                    <Glyphicon glyph="menu-left"/>&nbsp;
                    Back to Full Job List
                </Link>
            </div>
        );
    }
});

var LoadMoreButton = React.createClass({
    render: function () {
        return <Button onClick={this.onClick} bsStyle="default">
            Load more...
        </Button>;
    },

    onClick: function () {
        ItemStore.actions.fetch(this.props.jobId);
    }
});


var ItemsTable = React.createClass({
    render: function () {
        var items = this.props.items;
        var rows = items.map(item => {
            return <tr key={item._id}>
                <td>{item.status}</td>
                <td>{item.url}</td>
                <td></td>
            </tr>;
        });

        return <Table>
            <thead>
                <tr>
                    <th>Status</th>
                    <th>URL</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>{rows}</tbody>
        </Table>
    }
});

export var JobPage = React.createClass({
    mixins: [
        Reflux.connectFilter(ItemStore.store, "items", function(items) {
            return items[this.props.params.id] || [];
        }),

        Reflux.connectFilter(JobStore.store, "job", function(jobs) {
            return jobs.filter(job => job._id == this.props.params.id)[0];
        })
    ],

    componentDidMount: function () {
        if (this.state.job){
            ItemStore.actions.fetch(this.state.job._id);
        }
    },

    render: function () {
        var job = this.state.job;
        var items = this.state.items;

        if (!job){
            return <NoJobPage/>;
        }
        return <div>
            <ItemsTable items={items} />
            <LoadMoreButton jobId={job._id} />
        </div>;
    }
});
