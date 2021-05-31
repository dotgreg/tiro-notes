import {sharedConfig} from '../../shared/shared.config';
import { initSocketLogic } from './managers/socket.manager';
import { backConfig } from './config.back';
import { startStaticServer } from './managers/staticServer.manager';
import { getPlatform } from './managers/platform.manager';
import { createSecureServer, sslConfig } from './ssl.manager';
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
export const ioServer:SocketIO.Server = require('socket.io')(server, { serveClient: false })
initSocketLogic(); 

// localhost:port/ = static react client
app.use('/', express.static(backConfig.frontendBuildFolder));

// localhost:port/static = static resources serving
app.use('/static', express.static(backConfig.dataFolder ));

server.listen(port, function () {})
