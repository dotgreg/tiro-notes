import { initSocketLogic } from './managers/socket.manager';
import { backConfig } from './config.back';
import { getPlatform } from './managers/platform.manager';
import { sslConfig } from './ssl.manager';
import { isEnvDev } from './managers/path.manager';
import { fileLogClean, log } from './managers/log.manager';
import { startSecuredStaticServer } from './managers/staticServer.manager';
import { security, formatHeader} from './managers/security.manager';
import "./managers/activity.manager"
import { logActivity } from './managers/activity.manager';
import { scanDirForFolders, scanDirForFolders2 } from './managers/dir.manager';
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
// console.log(backConfig.frontendBuildFolder)
// redirect all to index.html
// app.use('/', express.static(backConfig.frontendBuildFolder));
app.use(express.static(backConfig.frontendBuildFolder));

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

app.get('*', (req, res) => {
    res.sendFile('index.html', { root: backConfig.frontendBuildFolder });
});

// app.get('*', (req, res) => {
//     res.redirect('/')
// })

// app.get('*', function(req, res){
// 	security.log(`NOK 404 => ${req.url} [${formatHeader(req.headers, "small")}]`)
// 	logActivity(`404`, `SECURITY:404:${req.url}`, req)
// 	res.status(404).send('Not found');
// });
 

// const test = async () => {
// 	// let {plugins, scanLog} = await scanPlugins()
// 	// scanDirForFolders("/")
// 	let res = scanDirForFolders("/")
// 	console.log(123, res)
// }
// test()