/* Main entry point */

var React = require("react");
var Router = require('react-router');
var { Route, RouteHandler, Link, DefaultRoute, NotFoundRoute } = Router;

var { JobListPage } = require("./pages/JobListPage");
var { JobPage } = require("./pages/JobPage");
var { NotFound } = require("./pages/NotFound");

var App = React.createClass({
  render () {
      // TODO: move most stuff from base.html here?
      return (
          <RouteHandler/>
      );
  }
});

var routes = (
    <Route path="/" handler={App}>
        <DefaultRoute handler={JobListPage} name="joblist" />
        <Route path=":id/" handler={JobPage} name="job" />
        <NotFoundRoute handler={NotFound} />
    </Route>
);

Router.run(routes, Router.HashLocation, (Root) => {
    React.render(<Root/>, document.getElementById("fortia-root"));
});
