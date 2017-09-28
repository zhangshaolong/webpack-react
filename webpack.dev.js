const mockProxyMiddleware = require('mock-proxy-middleware')
const common = require('./webpack.common.js')(false)
const mockConfig = require('./mock-proxy-config')
const port = 8888
const config = {
  devtool: 'eval-source-map',
  devServer: {
    contentBase: common.buildPath,
    host: '0.0.0.0',
    port: port,
    public: 'localhost:' + port,
    historyApiFallback: true,
    inline: true,
    setup: function(app) {
      app.use(mockProxyMiddleware(mockConfig))
    }
  }
}

module.exports = common.mergeConfig(config)