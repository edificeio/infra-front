var webpack = require("webpack");
var path = require("path");

module.exports = {
  context: path.resolve(__dirname, "./"),
  entry: {
    "ng-app": "./src/ts/ng-app",
  },
  output: {
    filename: "./bundle/[name].js",
  },
  resolve: {
    modulesDirectories: ["node_modules"],
    extensions: ["", ".ts", ".js"],
    alias: {
      'ua-parser-js': 'ua-parser-js/dist/ua-parser.min.js'
    }
  },
  devtool: "source-map",
  module: {
    loaders: [
      {
        test: /\.ts$/,
        loader: "awesome-typescript-loader",
      },
    ],
  },
  // No minification plugin here: the bundle is minified by the gulp `minify` task
  // (see gulpfile.js) with uglify-js 3.
};
