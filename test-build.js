const express = require('express')
const mockProxyMiddleware = require('mock-proxy-middleware')
const mockConfig = require('./mock-proxy-config')
const commander = require('child_process')
const app = express()
app.use(express.static(__dirname + '/dist'))
app.use(mockProxyMiddleware(mockConfig))
app.listen(8080)

let cmd;
if (process.platform == 'wind32') {
  cmd = 'start "%ProgramFiles%\Internet Explorer\iexplore.exe"';
} else if (process.platform == 'linux') {
  cmd = 'xdg-open';
} else if (process.platform == 'darwin') {
  cmd = 'open';
}
commander.exec(`${cmd} http://localhost:8080`)