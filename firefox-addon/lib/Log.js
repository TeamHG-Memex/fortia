/*
Logging module.
*/

const debug = require('./vendor/debug.js');
debug.useColors = () => false;
debug.enable('*');

exports.Log = (name) => debug("  addon: " + name + ":");
