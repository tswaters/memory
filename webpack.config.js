const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const OfflinePlugin = require('offline-plugin')

module.exports = (isProd => {

  const chunkhash = isProd ? '.[chunkhash]' : ''

  const loaders = [{
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
          ['@babel/preset-env', {targets: {node: 'current'}}],
          '@babel/preset-react'
        ],
        sourceMap: true,
        retainLines: true,
        env: {
          instrument: {
            plugins: [
              'istanbul'
            ]
          }
        }
      }
    }
  }, {
    test: /\.json$/,
    loader: 'json-loader'
  }, {
    test: /\.html$/,
    loader: 'html-loader'
  }, {
    test: /\.(css|less)$/,
    use: ExtractTextPlugin.extract({
      fallback: 'style-loader',
      use: [{
        loader: 'css-loader',
        options: {
          sourceMap: true,
          modules: true,
          camelCase: true,
          importLoaders: 1,
          localIdentName: isProd ? '[hash:base64:5]' : '[path][name]__[local]--[hash:base64:5]'
        }
      }, {
        loader: 'less-loader',
        options: {
          sourceMap: true,
          relativeUrls: true,
          noIeCompat: true
        }
      }]
    })
  }]

  const plugins = [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development')
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: ({resource}) => (/node_modules/).test(resource),
      filename: `vendor.bundle${chunkhash}.js`
    }),
    new HtmlWebpackPlugin({
      template: './src/html/index.html',
      filename: './index.html',
      minify: {
        collapseWhitespace: isProd
      }
    }),
    new ExtractTextPlugin({
      filename: `styles.${chunkhash}.css`,
      allChunks: true
    }),
    new OfflinePlugin({
      ServiceWorker: {
        minify: process.env.NODE_ENV === 'production'
      }
    }),
  ]

  if (isProd) {
    plugins.push(
      new webpack.LoaderOptionsPlugin({
        minimize: true
      }),
      new UglifyJSPlugin()
    )
  }

  return ({
    name: 'memory',
    devtool: isProd ? 'hidden-source-map' : 'eval-source-map',
    entry: {
      memory: './src/js'
    },
    target: 'web',
    output: {
      path: path.resolve('./dist'),
      filename: `memory${chunkhash}.js`
    },
    resolve: {
      extensions: [
        '.webpack.js',
        '.web.js',
        '.js',
        '.jsx',
        '.less',
        '.json'
      ]
    },
    module: {
      loaders
    },
    plugins
  })
})(process.env.NODE_ENV === 'production')
