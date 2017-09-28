const webpack = require('webpack')
const common = require('./webpack.common.js')(true)
const config = {
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin({
      output: {
        comments: false
      },
      compress: {
        warnings: false
      },
      minimize: true
    }),
    new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: '"production"'
        },
        'global': {}, // bizarre lodash(?) webpack workaround
        'global.GENTLY': false // superagent client fix
    })
  ]
}

module.exports = common.mergeConfig(config)