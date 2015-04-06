

/* Return a short random string */
function getRandomString() {
    return Math.random().toString(36).substr(2);
}


/* Return an unique CSS selector for the element */
function getUniquePath($elem) {
    var path, node = $elem;
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
