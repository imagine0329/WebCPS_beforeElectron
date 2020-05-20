const nodeExternals = require('webpack-node-externals');
const path = require('path');
const autoprefixer = require("autoprefixer");
const ExtractCSS = require("extract-text-webpack-plugin");

const MODE = process.env.WEBPACK_ENV;
const ENTRY_FILE = path.resolve(__dirname, "public", "javascripts", "main.js");
const OUTPUT_DIR = path.join(__dirname, "/public/static");


/*
module.exports = {
    target: 'node',
    mode: MODE,
    externals: [nodeExternals()],
    entry: ["@babel/polyfill", ENTRY_FILE],
    output: {
        path: OUTPUT_DIR,
        filename: 'main.js'
    }
};*/

const config = {
  entry: ["@babel/polyfill", ENTRY_FILE],
  mode: MODE,
  module: {
    rules: [
      {
        test: /\.(js)$/,
        use: [
          {
            loader: "babel-loader"
          }
        ]
      },
      {
        test: /\.(scss)$/,
        use: ExtractCSS.extract([
          {
            loader: "css-loader"
          },
          {
            loader: "postcss-loader",
            options: {
              plugin() {
                return [autoprefixer({ browsers: "cover 99.5%" })];
              }
            }
          },
          {
            loader: "sass-loader"
          }
        ])
      }
    ]
  },
  output: {
    path: OUTPUT_DIR,
    filename: "[name].js"
  },
  plugins: [new ExtractCSS("styles.css")]
};

module.exports = config;
