/** @jsx React.DOM */

/*
    =========================
 * React JSONTree
 * http://eskimospy.com/stuff/react/json/
 * Copyright 2014, David Vedder
 *
 * Changed by Mikhail Korobov
 *
 * MIT Licence
    =========================
 */

/**
 * Creates a React JSON Viewer component for a key and it's associated data
 *
 * @param key String The JSON key (property name) for the node
 * @param value Mixed The associated data for the JSON key
 * @return Component The React Component for that node
 */
var grabNode = function (key, value) {
    var nodeType = objType(value);
    var theNode;
    var aKey = key + Date.now();
    if (nodeType === 'Object') {
        theNode = <JSONObjectNode data={value} keyName={key} key={aKey}  />
    } else if (nodeType === 'Array') {
        theNode = <JSONArrayNode data={value}  keyName={key} key={aKey} />
    } else if (nodeType === 'String') {
        theNode = <JSONStringNode keyName={key} value={value} key={aKey} />
    } else if (nodeType === 'Number') {
        theNode = <JSONNumberNode keyName={key} value={value} key={aKey} />
    } else if (nodeType === 'Boolean') {
        theNode = <JSONBooleanNode keyName={key} value={value} key={aKey} />
    } else if (nodeType === 'Null') {
        theNode = <JSONNullNode keyName={key} value={value} key={aKey} />
    } else {
        console.error("How did this happen?", nodeType);
    }
    return theNode;
};

/**
 * Returns the type of an object as a string.
 *
 * @param obj Object The object you want to inspect
 * @return String The object's type
 */
var objType  = function (obj) {
    return Object.prototype.toString.call(obj).slice(8, -1);
};

/**
 * Mixin for stopping events from propagating and collapsing our tree all
 * willy nilly. 
 */
var SquashClickEventMixin = {
    handleClick: function (e) {
        e.stopPropagation();
    }
};

/**
 * Mixin for setting intial props and state and handling clicks on
 * nodes that can be expanded.
 */
var ExpandedStateHandlerMixin = {
    getDefaultProps: function () {
        return {data:[], initialExpanded: false};
    },
    getInitialState: function () {
        return {
            expanded: this.props.initialExpanded,
            createdChildNodes: false
        };
    },
    handleClick: function (e) {
        e.stopPropagation();
        this.setState({expanded: !this.state.expanded});
    },
    componentWillReceiveProps: function () {
        // resets our caches and flags we need to build child nodes again
        this.renderedChildren = [];
        this.itemString = false;
        this.needsChildNodes= true;
    }
};


/**
 * Array node class. If you have an array, this is what you should use to 
 * display it.
 */
var JSONArrayNode = React.createClass({
    mixins: [ExpandedStateHandlerMixin],
    /**
     * Returns the child nodes for each element in the array. If we have
     * generated them previously, we return from cache, otherwise we create 
     * them.
     */
    getChildNodes: function () {  
        var childNodes = [];
        if (this.state.expanded && this.needsChildNodes) {
            for (var i = 0; i < this.props.data.length; i += 1) {
                childNodes.push( grabNode(i, this.props.data[i]));
            }
            this.needsChildNodes = false;
            this.renderedChildren = childNodes;
        }
        return this.renderedChildren;
    },
    /**
     * flag to see if we still need to render our child nodes
     */
    needsChildNodes: true,
    /**
     * cache store for our child nodes
     */
    renderedChildren: [],
    /**
     * cache store for the number of items string we display
     */
    itemString: false,
    /**
     * Returns the "n Items" string for this node, generating and
     * caching it if it hasn't been created yet.
     */
    getItemString: function () {
        if (!this.itemString) {
            var lenWord = (this.props.data.length === 1) ? ' Item' : ' Items';
            this.itemString = this.props.data.length + lenWord;
        }
        return this.itemString;
    },
    render: function () {
        var childNodes = this.getChildNodes();
        var childListStyle = {
            display: (this.state.expanded) ? 'block' : 'none'
        };
        var cls = "array parentNode";
        cls += (this.state.expanded) ? " expanded" : '';
        return (
            <li className={cls} onClick={this.handleClick}>
                <label>{this.props.keyName}:</label>
                <span>{this.getItemString()}</span>
                <ol style={childListStyle}>
                    {childNodes}
                </ol>
            </li>
        );
    }
});

/**
 * Object node class. If you have an object, this is what you should use to 
 * display it.
 */
var JSONObjectNode = React.createClass({
    mixins: [ExpandedStateHandlerMixin],
    /**
     * Returns the child nodes for each element in the object. If we have
     * generated them previously, we return from cache, otherwise we create 
     * them.
     */
    getChildNodes: function () {
        if (this.state.expanded && this.needsChildNodes) {
            var obj = this.props.data;
            var childNodes = [];
            for (var k in obj) {
                if (obj.hasOwnProperty(k)) {
                    childNodes.push( grabNode(k, obj[k]));
                }
            }
            this.needsChildNodes = false;
            this.renderedChildren = childNodes;
        }
        return this.renderedChildren;
    },
    /**
     * Returns the "n Items" string for this node, generating and
     * caching it if it hasn't been created yet.
     */
    getItemString: function () {
        if (!this.itemString) {
            var obj = this.props.data;
            var len = 0;
            var lenWord = ' Items';
            for (var k in obj) {
                if (obj.hasOwnProperty(k)) {
                    len += 1;
                }
            }
            if (len === 1) {
                lenWord = ' Item';
            }
            this.itemString = len + lenWord
        }
        return this.itemString;
    },
    /**
     * cache store for the number of items string we display
     */
    itemString: false,
    /**
     * flag to see if we still need to render our child nodes
     */
    needsChildNodes: true,
    /**
     * cache store for our child nodes
     */
    renderedChildren: [],
    render: function () {
        var childListStyle = {
            display: (this.state.expanded) ? 'block' : 'none'
        };
        var cls = "object parentNode";
        cls += (this.state.expanded) ? " expanded" : '';

        var childrenList = (
            <ul style={childListStyle}>
                { this.getChildNodes() }
            </ul>
        );
        if (this.props.showRoot) {
            return (
                <li className={cls} onClick={this.handleClick}>
                    <label>{this.props.keyName}:</label>
                    <span>{this.getItemString()}</span>
                    {childrenList}
                </li>
            );
        }
        else {
            return childrenList;
        }

    }
});

/**
 * String node component
 */
var JSONStringNode = React.createClass({
    mixins: [SquashClickEventMixin],
    render: function () {
        return (
            <li className="string itemNode" onClick={this.handleClick}>
                <label>{this.props.keyName}:</label>
                <span>{this.props.value}</span>
            </li>
        );
    }
});

/**
 * Number node component
 */
var JSONNumberNode = React.createClass({
    mixins: [SquashClickEventMixin],
    render: function () {
        return (
            <li className="number itemNode" onClick={this.handleClick}>
                <label>{this.props.keyName}:</label>
                <span>{this.props.value}</span>
            </li>
        );
    }
});


/**
 * Null node component
 */
var JSONNullNode = React.createClass({
    mixins: [SquashClickEventMixin],
    render: function () {
        return (
            <li className="null itemNode" onClick={this.handleClick}>
                <label>{this.props.keyName}:</label>
                <span>null</span>
            </li>
        );
    }
});

/**
 * Boolean node component
 */
var JSONBooleanNode = React.createClass({
    mixins: [SquashClickEventMixin],
    render: function () {
        var truthString = (this.props.value) ? 'true' : 'false';
        return (
            <li className={"boolean itemNode " + truthString} onClick={this.handleClick}>
                <label>{this.props.keyName}:</label>
                <span>{truthString}</span>
            </li>
        );
    }
});

/**
 * JSONTree component. This is the 'viewer' base. Pass it a `data` prop and it 
 * will render that data.
 *
 * The first node it draws will be expanded by default.
 */
var JSONTree = React.createClass({
    render: function() {
        var nodeType = objType(this.props.data);
        var rootNode;
        if (nodeType === 'Object') {
            rootNode = <JSONObjectNode data={this.props.data} keyName="(root)" initialExpanded={true} showRoot={false} />
        } else if (nodeType === 'Array') {
            rootNode = <JSONArrayNode data={this.props.data} initialExpanded={true} keyName="(root)" />
        } else {
            console.error("How did you manage that?", nodeType);
        }
        return (
            <ul className="json_tree">
                { rootNode }
            </ul>
        );
    }
});

