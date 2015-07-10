/* A module with utilities for communication with the main addon code */
const EventEmitter = require('eventemitter3');


export function emit(action, data){
    window.parent.postMessage({action: action, data: data}, "*");
}


/* Listen to events sent by the main addon code */
var EE = new EventEmitter();

function handleMessages(msg) {
    var { event, data } = msg.data;
    if (!event){
        console.log("unknown message", msg);
    }
    EE.emit(event, data);
}

window.addEventListener("message", handleMessages, false);

export function on(event, listener) {
    EE.on(event, listener);
}

export function once(event, listener) {
    EE.once(event, listener);
}

export function off(event, listener) {
    EE.off(event, listener);
}

export function removeAllListeners(event, listener) {
    EE.removeAllListeners(event, listener);
}
