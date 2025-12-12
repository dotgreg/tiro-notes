import { backConfig } from './config.back';
import "./managers/activity.manager";
import { customBackendApiServer } from './managers/customBackendApi.manager';
import { fileLogClean, log } from './managers/log.manager';
import { isEnvDev } from './managers/path.manager';
import { getPlatform } from './managers/platform.manager';
import { initSocketLogic } from './managers/socket.manager';
import { startSecuredStaticServer } from './managers/staticServer.manager';
import { sslConfig } from './ssl.manager';
var compression = require('compression')
fileLogClean();

const archi = process.arch 


log(`===== TIRO SERVER STARTING ====== `)
log(`
isEnvDev: ${isEnvDev()}
port: ${backConfig.port}
https:${backConfig.https}
platform: ${JSON.stringify(getPlatform())}
`)


var express = require('express'); 
const app = express()

var cors = require('cors')
app.use(cors());
app.use(compression())


let server
if (backConfig.https) server = require("https").createServer(sslConfig, app)
else server = require("http").createServer(app)

// localhost:port/socket.io = socket server
export const ioServer: SocketIO.Server = require('socket.io')(server, { serveClient: false, pingTimeout: 10000, pingInterval: 50000 })
initSocketLogic();

// FRONTEND CLIENT SERVER on /
// redirect all to index.html
// app.use('/', express.static(backConfig.frontendBuildFolder));
app.use(express.static(backConfig.frontendBuildFolder));

////////////////////////////////////////////////
// RESSOURCES SERVER on /static
//
if (backConfig.dataFolder) {
	startSecuredStaticServer({
		expressApp: app,
		url: '/static',
		pathFolder: backConfig.dataFolder,
		cacheFront: true
	});
} 


server.listen(backConfig.port, function () {
	// THAT MESSAGE IS CRITICAL FOR ELECTRON TO START DISPLAYING THE WINDOW, AS WELL AS CLI TO GET BACKUP SYSTEM WORKING
	let configServerStr = JSON.stringify({ https: backConfig.https, port: backConfig.port, dataFolder: backConfig.dataFolder })
	log(`SERVER_LOAD_SUCCESS ${configServerStr}`);
})

////////////////////////////////////////////////
// CUSTOM BACKEND API >> ON DEV, ONLY WORKS by calling backend_server_url.com/custom_backend_api?....
//
app.get('/custom_backend_api', async (req, res) => {
	const apiAnswer = await customBackendApiServer(req.query);
	res.json(apiAnswer);
});

////////////////////////////////////////////////
// FRONTEND ON PROD, is not called during dev (replaced by react server)
//
app.get('*', (req, res) => {
    res.sendFile('index.html', { root: backConfig.frontendBuildFolder });
});
