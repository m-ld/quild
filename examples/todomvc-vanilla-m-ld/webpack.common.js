const webpack = require("webpack");
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    entry: {
        app: path.resolve(__dirname, "src", "app.js"),
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: "TodoMVC: JavaScript Es6 Webpack",
            template: path.resolve(__dirname, "src", "index.html"),
        }),
        // Polyfill Buffer for @m-ld/m-ld
        new webpack.ProvidePlugin({
            Buffer: ["buffer", "Buffer"],
        }),
    ],
    output: {
        filename: "[name].bundle.js",
        path: path.resolve(__dirname, "dist"),
        clean: true,
    },
    resolve: {
        fallback: {
            stream: require.resolve("stream-browserify"),
        },
    },
    module: {
        // Allow dynamic requires (for @m-ld/m-ld)
        exprContextCritical: false,
        rules: [
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: "asset/resource",
            },
        ],
    },
};
