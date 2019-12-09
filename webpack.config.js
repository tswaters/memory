const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const OfflinePlugin = require('offline-plugin')
const packageJson = require('./package.json')

module.exports = (env, argv) => {
  const chunkhash = argv.mode === 'production' ? '.[chunkhash]' : ''

  const rules = [
    {
      test: /\.jsx?$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          plugins: [
            '@babel/plugin-transform-runtime',
            '@babel/plugin-proposal-class-properties',
            '@babel/plugin-proposal-object-rest-spread'
          ],
          presets: [
            ['@babel/preset-env', { targets: '> 1%, not dead, not ie < 13' }],
            '@babel/preset-react'
          ],
          sourceMap: true,
          retainLines: true
        }
      }
    },
    {
      test: /\.html$/,
      loader: 'html-loader'
    },
    {
      test: /\.(css|less)$/,
      use: [
        {
          loader: MiniCssExtractPlugin.loader
        },
        {
          loader: 'css-loader',
          options: {
            sourceMap: true,
            modules: {
              localIdentName:
                argv.mode === 'production'
                  ? '[hash:base64:5]'
                  : '[path][name]__[local]--[hash:base64:5]'
            },
            localsConvention: 'camelCase',
            importLoaders: 1
          }
        },
        {
          loader: 'less-loader',
          options: {
            sourceMap: true,
            relativeUrls: true,
            noIeCompat: true
          }
        }
      ]
    }
  ]

  const plugins = [
    new webpack.DefinePlugin({
      'process.env.version': JSON.stringify(packageJson.version)
    }),
    new HtmlWebpackPlugin({
      template: './src/html/index.html',
      filename: './index.html',
      minify: {
        collapseWhitespace: argv.mode === 'production'
      }
    }),
    new MiniCssExtractPlugin({
      filename: `[name]${chunkhash}.css`,
      chunkFilename: `[id]${chunkhash}.css`
    }),
    new OfflinePlugin({
      ServiceWorker: {
        minify: argv.mode === 'production',
        events: true
      }
    })
  ]

  return {
    name: 'memory',
    devtool:
      argv.mode === 'production' ? 'hidden-source-map' : 'eval-source-map',
    entry: {
      memory: './src/js'
    },
    target: 'web',
    output: {
      path: path.resolve('./dist'),
      filename: `memory${chunkhash}.js`
    },
    optimization: {
      splitChunks: {
        chunks: 'all'
      },
      minimizer: [new TerserPlugin(), new OptimizeCSSAssetsPlugin({})]
    },
    resolve: {
      extensions: ['.webpack.js', '.web.js', '.js', '.jsx', '.less', '.json']
    },
    module: {
      rules
    },
    plugins
  }
}
