const path = require('path');
const TerserJSPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const {merge} = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'production',
  // devtool: 'eval-source-map',
  devtool: false,
  optimization: {
    moduleIds: 'deterministic',
    runtimeChunk: 'single',
    nodeEnv: 'production',
    removeEmptyChunks: false,
    mergeDuplicateChunks: false,
    splitChunks: {
      chunks: 'all',
      // minSize: 10000,
      // maxSize: 50000,
      automaticNameDelimiter: '-chunk-',
      cacheGroups: {
        vendor: {
          test: /\/node_modules\//,
          name: 'vendors',
          reuseExistingChunk: true,
          chunks: 'all'
        },
        lib: {
          test: /\/lib\//,
          name: 'lib',
          reuseExistingChunk: true,
          chunks: 'all'
        }
      },
    },
    minimize: true,
    minimizer: [
      new TerserJSPlugin(),
      new CssMinimizerPlugin(),
    ],
  },
  output: {
    publicPath: '',
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    clean: true
    // filename: (pathData) => {
    //   return pathData.chunk.name === 'sw' ? '[name].js': '[name].[contenthash].js';
    // },
  },
  module: {
    rules: [],
  },
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
    }),
  ],
});