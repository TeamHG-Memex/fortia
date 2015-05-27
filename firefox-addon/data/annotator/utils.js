
/* Return a short random string */
function getRandomString() {
    var res = Math.random().toString(36).substr(2);
    while (res.length < 12){
        res = res + "x";
    }
    return res;
}

/* Return an unique CSS selector for the element */
function getUniquePath($elem) {
    var path = '';
    var node = $elem;
    while (node.length) {
        var realNode = node[0], name = realNode.localName;
        if (!name) {
            break;
        }
        name = name.toLowerCase();
        var parent = node.parent();
        var siblings = parent.children(name);
        if (siblings.length > 1) {
            name += ':eq(' + siblings.index(realNode) + ')';
        }
        path = name + (path ? '>' + path : '');
        node = parent;
    }
    return path;
}

/* Log object */
function Log(name) {
    return debug("in-page: " + name);
}

function InstanceLog(name) {
    return Log(getRandomString() + ": " + name);
}

debug.useColors = () => false;
debug.enable('*');

