/* A list of crawled pages */

var Reflux = require("reflux");
var api = require("../utils/api");

export var actions = Reflux.createActions([
    "init",
    "fetch"
]);

export var store = Reflux.createStore({
    init: function () {
        this.items = {};
        this.listenToMany(actions);
    },

    getInitialState: function () { return this.items },

    onInit: function (items) {
        this.items = items;
        this.trigger(items);
    },

    onFetch: function (jobId) {
        this.items[jobId] = this.items[jobId] || [];

        var lastId = null;
        var size = this.items[jobId].length
        if (size) {
            var lastId = this.items[jobId][size-1]._id;
        }

        api.getJobItems(jobId, lastId).then(data => {
            if (data.status == 'ok') {
                this.items[jobId] = this.items[jobId].concat(data.result);
                this.trigger(this.items);
            }
            console.log(data);
        });
    }
});
