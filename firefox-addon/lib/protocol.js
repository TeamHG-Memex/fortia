/*
A custom handler for links which uses fortia: protocol.
Links should be in the following format:

    fortia:http://<server-address>?goto=<requested url>

Example:

    fortia:http://127.0.0.1:5000/foo?goto=http%3A%2F%2Fstackoverflow.com%2Fquestions%2F29268299

<server-address> is an address of Fortia server which is used to store the
annotation results.

<requested url> is an address of a web page to annotate.
It should be urlencoded.

*/

const querystring = require('sdk/querystring');
const { URL } = require('sdk/url');
const { EventTarget } = require("sdk/event/target");
const { emit } = require('sdk/event/core');
const { Class } = require('sdk/core/heritage');
const { Unknown, Factory } = require('sdk/platform/xpcom');
const { Cc, Ci } = require('chrome');
const nsIProtocolHandler = Ci.nsIProtocolHandler;


// An object which allows to listen to newChannel event.
// This event is emitted when user tries to follow fortia: link.
const target = EventTarget();
exports.events = target;


/* Extract 'server' and 'goto' parts from fortia: URLs */
function parseFortiaUrl(spec){
    var url = URL(/^fortia:(.*)/.exec(spec)[1]);
    var server = url.scheme + "://" + url.host;
    if (url.port){
        server += ":" + url.port;
    }
    server += url.pathname;
    var query = querystring.parse(url.search.slice(1));
    return {server: server, goto: query.goto};
}


/* A handler for fortia: protocol */
var FortiaProtocolHandler = Class({
    extends: Unknown,
    interfaces: ['nsIProtocolHandler'],

    defaultPort: 80,
    scheme: "fortia",
    protocolFlags: Ci.nsIProtocolHandler.URI_LOADABLE_BY_ANYONE |
                   Ci.nsIProtocolHandler.URI_NOAUTH,
                   //Ci.nsIProtocolHandler.URI_NORELATIVE,
    allowPort: function (port, sheme) {
        return false;
    },
    newURI: function (aSpec, aOriginCharset, aBaseURI) {
        var uri = Cc["@mozilla.org/network/simple-uri;1"].createInstance(Ci.nsIURI);
        uri.spec = aSpec;
        return uri;
    },
    newChannel: function(aURI) {
        const ioservice = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
        var parsed = parseFortiaUrl(aURI.spec);
        var uri = ioservice.newURI(parsed.goto, null, null);
        var channel = ioservice.newChannelFromURI(uri, null).QueryInterface(Ci.nsIHttpChannel);
        channel.redirectTo(uri);
        emit(target, 'newChannel', parsed);
        return channel;
    }
});


// register the protocol handler
var factory = Factory({
    contract: "@mozilla.org/network/protocol;1?name=fortia",
    Component: FortiaProtocolHandler,
});


