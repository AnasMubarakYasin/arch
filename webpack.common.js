const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');
// const MediaQuerySplittingPlugin = require('media-query-splitting-plugin');
// const PreloadWebpackPlugin = require('preload-webpack-plugin');
// const CopyPlugin = require('copy-webpack-plugin');
const WebpackAssetsManifest = require('webpack-assets-manifest');
// const WebpackPwaManifest = require('webpack-pwa-manifest');
// const {InjectManifest} = require('workbox-webpack-plugin');
// const ImageminPlugin = require('imagemin-webpack-plugin').default

const mode = process.argv['production'] ? 'production' : 'development';
const sourceMap = mode === 'production' ? false : true;
const esModule = true;
const entryDir = 'example';
const cssModule = {
  compileType: 'icss', // 'icss' | ''module
  exportLocalsConvention: 'camelCaseOnly', /// 'camelCase',
  localIdentName: mode === 'development' ? '[path][name]' : '[hash]',
  exportGlobals: true,
  namedExport: true,
  mode: (resourcePath) => {
    if (/\.module\./igm.test(resourcePath)) {
      return 'local';
    }
    if (/.*\.pure\.(css|s[ac]ss)$/i.test(resourcePath)) {
      return 'pure';
    }
    return 'global';
  },
}

module.exports = {
  name: 'todo-list',
  entry: {
    index: path.resolve(__dirname, entryDir, 'script/index.ts'),
  },
  target: 'web',
  optimization: {
    usedExports: true,
  },
  plugins: [
    new CleanWebpackPlugin({
      verbose: true,
    }),
    new HtmlWebpackPlugin({
      // title: 'main',
      filename: 'index.html',
      template: path.resolve(__dirname, entryDir, 'template/index.html'),
      inject: true,
      minify: true,
      scriptLoading: 'defer',
      // favicon: './src/public/images/logo/foodhunt.png',
      meta: {
        // 'description': 'web app wich providing list of restaurant',
      },
    }),
    new MiniCssExtractPlugin({
      filename: mode === 'production' ? '[name].[contenthash].css' : '[name].css',
    }),
    // new WebpackPwaManifest({
    //   filename: 'manifest.json',
    //   includeDirectory: true,
    //   fingerprints: true,
    //   crossorigin: null,
    //   inject: true,
    //   ios: {
    //     'apple-mobile-web-app-title': 'FoodHunt',
    //     'apple-mobile-web-app-status-bar-style': '#cb4900',
    //   },
    //   name: 'FoodHunt Web App',
    //   short_name: 'FoodHunt',
    //   start_url: '/',
    //   background_color: '#ff8f44',
    //   theme_color: '#ff8f44',
    //   categories: ['food', 'drink', 'restaurant'],
    //   description: 'web app wich providing list of restaurant',
    //   dispalay: 'standalone',
    //   orientation: 'any',
    //   scope: './',
    //   lang: 'id',
    //   dir: 'auto',
    //   iarc_rating_id: '',
    //   icons: [
    //     {
    //       src: './src/public/images/logo/foodhunt-192px.png',
    //       size: 192,
    //       type: 'png',
    //       ios: true,
    //       destination: './public/images/logo/',
    //     },
    //     {
    //       src: './src/public/images/logo/foodhunt.png',
    //       size: 512,
    //       type: 'png',
    //       ios: true,
    //       destination: './public/images/logo/',
    //     },
    //     {
    //       src: './src/public/images/logo/foodhunt.svg',
    //       sizes: [48, 96, 144, 192, 240, 512],
    //       purpose: 'maskable',
    //       type: 'image/svg+xml',
    //       ios: true,
    //       destination: './public/images/logo/',
    //     },
    //   ],
    //   prefer_related_applications: false,
    //   related_applications: [{
    //     'platform': 'webapp',
    //     'url': 'http://127.0.0.1:8887/manifest.json',
    //   }],
    // }),
    new ImageMinimizerPlugin({
      test: /\.(jpe?g|png|gif|svg)$/i,
      // filename: '[path][name][ext]',
      minimizerOptions: {
        plugins: [
          ['gifsicle', { interlaced: true }],
          ['jpegtran', { progressive: true }],
          ['optipng', { optimizationLevel: 5 }], 
          ['svgo', { plugins: [{ removeViewBox: false, },],},],
        ],
      },
    }),
    new ImageMinimizerPlugin({
      test: /\.(png)$/i,
      filename: '[path][name].webp',
      minimizerOptions: {
        plugins: ['imagemin-webp'],
      },
    }),
    new WebpackAssetsManifest({
      output: 'resource.json',
      writeToDisk: true,
    }),
  ],
  module: {
    rules: [
      {
        sideEffects: true,
      },
      {
        test: /\.html$/i,
        loader: 'html-loader',
        options: {
          minimize: {
            removeComments: true,
            collapseWhitespace: true,
            minifyCSS: false,
            minifyJS: false,
          },
          esModule,
        },
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              modules: cssModule,
            }
          },
          'postcss-loader'
        ],
        exclude: /\.module\.css$/
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          mode == 'production' ? MiniCssExtractPlugin.loader : {
            loader: 'style-loader',
            options: {
              injectType: 'linkTag',
              attributes: {
                nonce: '',
              },
              esModule,
              // sourceMap,
            }
          },
          {
            loader: 'css-loader',
            options: {
              importLoaders: 2,
              modules: cssModule,
              esModule,
              // sourceMap,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              // postcssOptions: {
              //   parser: "postcss-js",
              // },
              // execute: true,
              implementation: require("postcss"),
              plugins: [
                [
                  "postcss-preset-env",
                  {},
                ],
              ],
            },
          },
          {
            loader: 'sass-loader',
            options: {
              implementation: require('sass'),
              sourceMap,
            },
          },
        ],
      },
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              happyPackMode: mode == 'development' ? false : true,
            },
          },
        ],
        exclude: /node_modules/
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset',
        generator: {
          filename: mode == 'production' ? 'assets/[hash][ext]' : 'assets/[name][ext]'
        }
      },
      {
        test: /\.(jpe?g|png|gif|svg|webp)$/i,
        type: 'asset',
        generator: {
          filename: mode == 'production' ? 'assets/[hash][ext]' : 'assets/[name][ext]'
        }
      },
      {
        resourceQuery: /raw/,
        type: 'asset/source',
      }
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    alias: {
      lib: path.resolve(__dirname, 'src'),
    },
    symlinks: false
  },
};
