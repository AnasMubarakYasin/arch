// const fs = require('fs');
const path = require('path');
const {merge} = require('webpack-merge');
const common = require('./webpack.common');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'eval-cheap-module-source-map', // 'inline-source-map'
  devServer: {
    contentBase: path.resolve(__dirname, 'dist'),
    liveReload: true,
    hot: false,
    port: 9060,
    historyApiFallback: true,
    writeToDisk: true,
    overlay: true,
    publicPath: '',
    watchContentBase: true,
    // https: true,
    // key: fs.readFileSync('./cert/localhost-key.pem'),
    // cert: fs.readFileSync('./cert/localhost.pem'),
    // index: 'index.html',
    // openPage: './dist'
    headers: {
      'Cache-Control': 'no-store',
    },
  },
  optimization: {
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false,
  },
  output: {
    publicPath: '',
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    pathinfo: false,
    // assetModuleFilename: 'assets/[hash][ext][query]',
  },
  module: {
    rules: [],
  },
  plugins: [],
});