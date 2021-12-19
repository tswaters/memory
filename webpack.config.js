const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerWebpackPlugin = require('css-minimizer-webpack-plugin')
const OfflinePlugin = require('@lcdp/offline-plugin')
const packageJson = require('./package.json')

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production'
  const chunkhash = isProd ? '.[chunkhash]' : ''
  const devtool = isProd ? 'hidden-source-map' : 'eval-source-map'
  const localIdentName = isProd
    ? '[hash:base64:5]'
    : '[path][name]__[local]--[hash:base64:5]'
  return {
    name: 'memory',
    devtool,
    entry: {
      memory: './src/js',
    },
    target: 'web',
    output: {
      path: path.resolve('./dist'),
      filename: `memory${chunkhash}.js`,
    },
    optimization: {
      minimizer: [new CssMinimizerWebpackPlugin({}), '...'],
    },
    resolve: {
      extensions: ['.webpack.js', '.web.js', '.js', '.jsx', '.less', '.json'],
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          loader: 'babel-loader',
        },
        {
          test: /\.(css|less)$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
            },
            {
              loader: 'css-loader',
              options: {
                sourceMap: true,
                esModule: true,
                modules: {
                  namedExport: true,
                  localIdentName,
                  exportLocalsConvention: 'camelCaseOnly',
                },
                importLoaders: 1,
              },
            },
            {
              loader: 'less-loader',
              options: {
                sourceMap: true,
              },
            },
          ],
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.version': JSON.stringify(packageJson.version),
      }),
      new HtmlWebpackPlugin({
        template: './src/html/index.html',
        filename: './index.html',
        minify: {
          collapseWhitespace: isProd,
        },
      }),
      new MiniCssExtractPlugin({
        filename: `[name]${chunkhash}.css`,
        chunkFilename: `[id]${chunkhash}.css`,
      }),
      new OfflinePlugin({
        ServiceWorker: {
          minify: isProd,
          events: true,
        },
      }),
    ],
  }
}
