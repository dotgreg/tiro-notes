import { initSocketLogic } from './managers/socket.manager';
import { backConfig } from './config.back';
import { getPlatform } from './managers/platform.manager';
import { sslConfig } from './ssl.manager';
import { isEnvDev } from './managers/path.manager';
import { fileLogClean, log } from './managers/log.manager';
import { startSecuredStaticServer } from './managers/staticServer.manager';
import { searchWord } from './managers/search/word.search.manager';

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

var cors = require('cors')
app.use(cors());

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
	// THAT MESSAGE IS CRITICAL FOR ELECTRON TO START DISPLAYING THE WINDOW, AS WELL AS CLI TO GET BACKUP SYSTEM WORKING
	let configServerStr = JSON.stringify({ https: backConfig.https, port: backConfig.port, dataFolder: backConfig.dataFolder })
	log(`SERVER_LOAD_SUCCESS ${configServerStr}`);
})


// searchWord({
// 	term: "#[^ #]+",
// 	folder: '/test_obsi/nodal_ex',
// 	cb: res => {
// 		console.log(333, res, 333);
// 	}
// })

// searchWord({
// 	term: "marx",
// 	folder: '/test_obsi/nodal_ex',
// 	cb: res => {
// 		console.log(333, res, 333);
// 	}
// })

// GOAL IS HAVING
