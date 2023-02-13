const path = require('path');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin")

module.exports = env => {
  return {
    entry: env.production ? ['./lib.ts'] : ['./index.ts', './style.css'],
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.html$/i,
          loader: "html-loader",
        },
        {
          test: /\.scss$/i,
          use: [
            MiniCssExtractPlugin.loader,
            "css-loader",
            "sass-loader"
          ],
        },
        {
          test: /\.css$/i,
          use: [
            // "style-loader",
            MiniCssExtractPlugin.loader,
            "css-loader"
          ],
        },
        {
          test: /\.(png|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/icons/[hash][ext][query]'
          }
        },
        {
          test: /\.(svg)$/i,
          loader: 'svg-inline-loader'
        }
      ],
    },
    mode: env.production ? 'production' : 'development',
    plugins: env.production ?
        [
          new CleanWebpackPlugin(),
          new MiniCssExtractPlugin(),
        ] : [
          new CleanWebpackPlugin(),
          new MiniCssExtractPlugin(),
          new HtmlWebpackPlugin({
            template: path.resolve(__dirname, 'index.html'),
          })
        ],
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.css'],
    },
    optimization: {
      minimize: false
    },
    output: {
      filename: 'index.js',
      path: path.resolve(__dirname, 'dist'),
      library: {
        name: '@cobalt/prosenext',
        type: 'umd',
      }
    },
    externals:env.production ? {
      "prosemirror-commands": "prosemirror-commands",
      "prosemirror-dropcursor": "prosemirror-dropcursor",
      "prosemirror-gapcursor": "prosemirror-gapcursor",
      "prosemirror-history": "prosemirror-history",
      "prosemirror-inputrules": "prosemirror-inputrules",
      "prosemirror-keymap": "prosemirror-keymap",
      "prosemirror-menu": "prosemirror-menu",
      "prosemirror-model": "prosemirror-model",
      "prosemirror-schema-list": "prosemirror-schema-list",
      "prosemirror-state": "prosemirror-state",
      "prosemirror-view": "prosemirror-view"
    } : {}
  };
}
