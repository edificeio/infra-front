var webpack = require('webpack');
var path = require('path');

module.exports = {
    context: path.resolve(__dirname, './'),
    entry: {
        'ng-app': './src/ts/ng-app'
    },
    output: {
        filename: './bundle/[name].js'
    },
    resolve: {
        modulesDirectories: ['node_modules'],
        extensions: ['', '.ts', '.js']
    },
    devtool: "inline-source-map",
    module: {
        loaders: [
            {
                test: /\.ts$/,
                loader: 'awesome-typescript-loader'
            }
        ]
    }
}