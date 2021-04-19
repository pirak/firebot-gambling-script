const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const packageJson = require("./package.json");

module.exports = {
    target: 'node',
    mode: 'production',
    devtool: false,
    entry: {
        main: './src/main.ts',
    },
    output: {
        libraryTarget: 'commonjs2',
        libraryExport: 'default',
        path: path.resolve(__dirname, './dist'),
        filename: `${packageJson.scriptOutputName}.js`,
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /(node_modules|bower_components)/,
                use: 'ts-loader',
            },
        ],
    },
    optimization: {
        minimize: true,

        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    keep_fnames: /index/,
                    mangle: false,
                    format: {
                        comments: false,
                    },
                },
                extractComments: false,
            }),
        ],
    },
};