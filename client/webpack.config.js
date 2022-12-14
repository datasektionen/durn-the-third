const { resolve } = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const TerserWebpackPlugin = require("terser-webpack-plugin");
const dotEnv = require('dotenv-webpack');

const isProd = process.env.NODE_ENV === "production";


const config = {
  mode: isProd ? "production" : "development",
  entry: {
    index: "./client/src/index.tsx",
  },
  output: {
    path: resolve(__dirname, "../dist"),
    filename: "bundle.js",
  },
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "babel-loader",
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./client/src/index.html",
      filename: "index.html",
      inject: "body",
    }),
    new dotEnv({
      path: "./.env",
      systemvars: true,
    }),
  ], 
  devtool: "eval-cheap-source-map"
};

if (isProd) {
  config.optimization = {
    minimizer: [new TerserWebpackPlugin()],
  };
} else {
  config.devServer = {
    port: 8080,
    open: true,
    hot: true,
    compress: true,
    stats: "errors-only",
    overlay: true,
    proxy: {
      "/api/*": {
        target: "http://localhost:3000/",
        secure: "false"
      },
    }
  };
}

module.exports = config;