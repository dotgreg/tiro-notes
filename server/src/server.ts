import { initSocketLogic } from './managers/socket.manager';
import { backConfig } from './config.back';
import { getPlatform } from './managers/platform.manager';
import { sslConfig } from './ssl.manager';
import { isEnvDev } from './managers/path.manager';


let protocol = (backConfig.jsonConfig && backConfig.jsonConfig.https === 'true') ? 'https' : 'http'
let port = (backConfig.jsonConfig && backConfig.jsonConfig.port) ? parseInt(backConfig.jsonConfig.port) : 3023

console.log(`1===== SERVER STARTING ====== (isEnvDev: ${isEnvDev()}, port: ${port}, protocol:${protocol}, platform: ${getPlatform()})`, backConfig) 
var express = require('express');
const app = express()

let server 
if (protocol === 'https') server = require("https").createServer(sslConfig, app)
else server = require("http").createServer(app)

// localhost:port/socket.io = socket server
export const ioServer:SocketIO.Server = require('socket.io')(server, { serveClient: false, pingTimeout: 10000, pingInterval: 50000})
initSocketLogic(); 

// localhost:port/ = static react client
app.use('/', express.static(backConfig.frontendBuildFolder));

// localhost:port/static = static resources serving
if (backConfig.dataFolder) app.use('/static', express.static(backConfig.dataFolder));

server.listen(port, function () {})
