const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')

const buildPath = __dirname + '/dist'

module.exports = (prod) => {
  return {
    buildPath: buildPath,
    mergeConfig: function (config) {
      for (let key in config) {
        let val = this.configs[key]
        if (Array.isArray(val)) {
          this.configs[key] = this.configs[key].concat(config[key])
        } else {
          this.configs[key] = config[key]
        }
      }
      return this.configs
    },
    configs: {
      entry: __dirname + '/src/app.js',
      output: {
        path: buildPath,
        filename: '[name]-[hash].js'
      },
      resolve: {
        alias: {
          service: __dirname + '/src/common/service.js',
          utils: __dirname + '/src/common/utils.js'
        }
      },
      module: {
        rules: [
          {
            test: /\.json$/,
            use: 'json-loader'
          },
          {
            test: /\.jsx?$/,
            exclude: /node_modules/,
            use: {
              loader: 'babel-loader',
              options: {
                cacheDirectory: true,
                presets: ['env', 'react']
              }
            }
          },
          {
            test: /\.(?:c|le)ss$/,
            use: ExtractTextPlugin.extract({
              fallback: 'style-loader',
              use: [
                {
                  loader: 'css-loader',
                  options: {
                    minimize: prod //css压缩
                  }
                },
                'postcss-loader',
                'less-loader'
              ]
            })
          }
        ]
      },
      node: {
        fs: 'empty'
      },
      plugins: [
        new HtmlWebpackPlugin({
          title: 'webpack react',
          inject: true,
          chunksSortMode: 'dependency',
          template: __dirname + '/src/app.html',
          minify: prod ? {
            collapseInlineTagWhitespace: true,
            removeComments: true,
            collapseWhitespace: true,
            removeTagWhitespace: true
          } : false
        }),
        new ExtractTextPlugin('[name]-[hash].css')
      ]
    }
  }
}