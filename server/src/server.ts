import { initSocketLogic } from './managers/socket.manager';
import { backConfig } from './config.back';
import { getPlatform } from './managers/platform.manager';
import { sslConfig } from './ssl.manager';
import { isEnvDev } from './managers/path.manager';
import { fileLogClean, log } from './managers/log.manager';
import { cloneDeep } from 'lodash';

fileLogClean();

const backConfigToShow: any = cloneDeep(backConfig)
backConfigToShow.sharedConfig.strings = {}


log(`===== TIRO SERVER STARTING ====== (isEnvDev: ${isEnvDev()}, port: ${backConfig.port}, https:${backConfig.https}, platform: ${getPlatform()})`, backConfigToShow)



var express = require('express');
const app = express()

let server
if (backConfig.https) server = require("https").createServer(sslConfig, app)
else server = require("http").createServer(app)

// localhost:port/socket.io = socket server
export const ioServer: SocketIO.Server = require('socket.io')(server, { serveClient: false, pingTimeout: 10000, pingInterval: 50000 })
initSocketLogic();

// localhost:port/ = static react client
app.use('/', express.static(backConfig.frontendBuildFolder));

// localhost:port/static = static resources serving
if (backConfig.dataFolder) app.use('/static', express.static(backConfig.dataFolder));

server.listen(backConfig.port, function() {
	log('SERVER_LOAD_SUCCESS : Tiro server started successfully');
})
