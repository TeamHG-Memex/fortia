/* Job page */

var React = require("react");
var Reflux = require("reflux");
var { Link, Navigation } = require('react-router');
var { Panel, Table, Button } = require("react-bootstrap");

var JobStore = require("../stores/JobStore");
var { parsePythonTimestamp } = require("../utils/time");


var JobRow = React.createClass({
    render: function () {
        var job = this.props.job;
        var domain = job.stats ? job.stats['arachnado/domain'] : "unknown";
        var startedAt = parsePythonTimestamp(job['started_at']) || "?";
        var finishedAt = parsePythonTimestamp(job['finished_at']) || "?";

        return <tr style={{cursor:"pointer"}} onClick={this.props.onClick}>
            <td>{domain}</td>
            <td>{startedAt.toLocaleString()}</td>
            <td>{finishedAt.toLocaleString()}</td>
        </tr>;
    }
});


var JobList = React.createClass({
    mixins: [Navigation],

    render: function () {
        var jobs = this.props.jobs;

        var rows = jobs.map(job => {
            var onClick = () => (this.transitionTo("job", {id: job._id}));
            return <JobRow key={job._id} job={job} onClick={onClick} />
        });

        return <Table hover>
            <thead>
                <caption>Jobs</caption>
                <tr>
                    <th>Domain</th>
                    <th>Started At</th>
                    <th>Finished At</th>
                </tr>
            </thead>
            <tbody>{rows}</tbody>
        </Table>;
    }
});


export var JobListPage = React.createClass({
    mixins: [
        Reflux.connect(JobStore.store, "jobs")
    ],

    render: function () {
        var jobs = this.state.jobs;
        if (!jobs){
            return <div>no jobs</div>;
        }
        return <JobList jobs={jobs}/>;
    }
});
