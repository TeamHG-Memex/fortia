/* A list of crawl jobs */

var Reflux = require("reflux");

export var actions = Reflux.createActions(["init"]);

export var store = Reflux.createStore({
    init: function () {
        this.jobs = [];
        this.listenToMany(actions);
    },

    getInitialState: function () { return this.jobs },

    onInit: function (jobs) {
        this.jobs = jobs;
        this.trigger(jobs);
    }
});


if (window.JOBS){
    actions.init(window.JOBS);
}

