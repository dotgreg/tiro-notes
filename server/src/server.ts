import { initSocketLogic } from './managers/socket.manager';
import { backConfig } from './config.back';
import { getPlatform } from './managers/platform.manager';
import { sslConfig } from './ssl.manager';
import { isEnvDev } from './managers/path.manager';
import { fileLogClean, log } from './managers/log.manager';
import { cloneDeep } from 'lodash';
import { startSecuredStaticServer } from './managers/staticServer.manager';

fileLogClean();

const archi = process.arch


log(`===== TIRO SERVER STARTING ====== `)
log(`
isEnvDev: ${isEnvDev()}
port: ${backConfig.port}
https:${backConfig.https}
platform: ${getPlatform()}
architecture: ${archi}
`)



var express = require('express');
const app = express()

let server
if (backConfig.https) server = require("https").createServer(sslConfig, app)
else server = require("http").createServer(app)

// localhost:port/socket.io = socket server
export const ioServer: SocketIO.Server = require('socket.io')(server, { serveClient: false, pingTimeout: 10000, pingInterval: 50000 })
initSocketLogic();

// FRONTEND CLIENT SERVER on /
app.use('/', express.static(backConfig.frontendBuildFolder));

// RESSOURCES SERVER on /static
if (backConfig.dataFolder) {
	startSecuredStaticServer({
		expressApp: app,
		url: '/static',
		pathFolder: backConfig.dataFolder
	});
}


server.listen(backConfig.port, function () {
	// THAT MESSAGE IS CRITICAL FOR ELECTRON TO START DISPLAYING THE WINDOW
	let configServerStr = JSON.stringify({ https: backConfig.https, port: backConfig.port })
	log(`SERVER_LOAD_SUCCESS ${configServerStr}`);
})
