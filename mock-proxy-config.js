module.exports = {
  apiConfig: {
    type: 'prefix',
    value: ['/static/map_editor_tiles/zone/', '/map_editor/api/']
  },
  ignoreProxyPaths: {
    '/map_editor/api/editor/data': 1
  },
  proxyInfo: {
    // host: '10.94.97.203',
    port: '8088'
  },
  mockPath: 'mock'
}