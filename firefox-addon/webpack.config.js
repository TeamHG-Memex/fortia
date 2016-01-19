var path = require('path');
var webpack = require('webpack');

function _data(name){
    return path.resolve(__dirname, 'data/', name);
}

module.exports = {
    entry: {
        'toolbar': _data("toolbar/toolbar.jsx"),
    },
    output: {
        path: _data("build"),
        filename: '[name].js'
    },
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                loader: "babel-loader"
            }
        ]
    },
    resolve: {
        extensions: ['', '.js', '.jsx']
    },
    externals: {
        react: "React"
    }
};
