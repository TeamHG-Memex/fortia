
var { Request } = require("sdk/request");
var utils = require("./utils.js");
var { Log } = require("./Log.js");

/*
An object to communicate with Fortia Server.
*/
function FortiaClient(serverUrl) {
    this.serverUrl = serverUrl;
    this.log = Log("FortiaClient(" + serverUrl + ")");
}


FortiaClient.prototype = {

    /*
    Send a request to Fortia Server JSON endpoint.
    `opts` should contain the following fields:

        client.request({
            endpoint: "endpoint",
            content: {key: value},
            onSuccess: (decodedResult) => {...},
            onFailure: (response) => {...}
        });

    */
    request: function (opts) {
        var url = this.serverUrl + opts.endpoint;
        this.log("sending request to " + url);
        var req = Request({
            url: url,
            contentType: 'application/json',
            content: JSON.stringify(opts.content),
            onComplete: (resp) => {
                this.log("got response", resp.status, resp.text);
                if (resp.status == 200) {
                    opts.onSuccess(resp.json);
                }
                else {
                    opts.onFailure(resp);
                }
            }
        });
        req.post();
    }
};


exports.FortiaClient = FortiaClient;
