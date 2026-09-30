import path from 'node:path'
import webpack from 'webpack'
import WorkboxPlugin from 'workbox-webpack-plugin'
import packageJson from './package.json' with { type: 'json' }

export default (env, argv) => {
  const isProd = argv.mode === 'production'
  const OFFLINE_PLUGIN_ENABLED = isProd
  const devtool = isProd ? 'hidden-source-map' : 'eval-source-map'
  const localIdentName = isProd
    ? '[hash:base64:5]'
    : '[path][name]__[local]--[hash:base64:5]'
  return {
    name: 'memory',
    devtool,
    entry: {
      memory: './src/index.html',
    },
    target: 'web',
    output: {
      crossOriginLoading: 'anonymous',
      path: path.resolve('./dist'),
      module: true,
      html: {
        integrity: true,
        csp: true,
      },
    },
    experiments: {
      asset: true,
      css: true,
      html: true,
    },
    optimization: {
      minimize: {
        html: {
          collapseWhitespace: isProd,
        },
      },
      splitChunks: {
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            chunks: 'all',
          },
        },
      },
    },
    resolve: {
      extensions: ['.webpack.js', '.web.js', '.js', '.jsx', '.less', '.json'],
    },
    module: {
      parser: {
        'css/module': {
          namedExports: true,
          dashedIdents: false,
        },
      },
      generator: {
        'css/module': {
          localIdentName,
          exportsConvention: 'camel-case-only',
        },
      },
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          loader: 'babel-loader',
          options: {
            sourceMaps: true,
            retainLines: true,
            plugins: ['@babel/plugin-transform-runtime'],
            presets: [
              '@babel/preset-env',
              ['@babel/preset-react', { development: !isProd }],
            ],
          },
        },
        {
          test: /\.(css|less)$/,
          type: 'css/module',
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        'window.APP_VERSION': JSON.stringify(packageJson.version),
        'window.OFFLINE_PLUGIN_ENABLED': JSON.stringify(OFFLINE_PLUGIN_ENABLED),
      }),
      OFFLINE_PLUGIN_ENABLED &&
        new WorkboxPlugin.GenerateSW({
          clientsClaim: true,
          skipWaiting: true,
          swDest: 'sw.js',
        }),
    ].filter(Boolean),
  }
}
