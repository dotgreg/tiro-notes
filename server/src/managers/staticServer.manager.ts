import { backConfig } from "../config.back";
import { log } from "./log.manager";
import { getLoginToken } from "./loginToken.manager";


var serveStatic = require('serve-static');
var finalhandler = require('finalhandler')

export const startSecuredStaticServer = (p: { expressApp: any, url: string, pathFolder: string }) => {

	var serve = serveStatic(p.pathFolder);

	p.expressApp.use(p.url, (req, res) => {

		let isTokenCorrect = false
		if (req.query.token && req.query.token === getLoginToken()) isTokenCorrect = true

		if (isTokenCorrect) {
			serve(req, res, finalhandler(req, res))
		} else {
			log(`[STATIC SERVER] error: requested a resource with login token either absent or wrong, ${req.url}, ${req.query.token}`);
		}

	});
}


// export const startStaticServer = (path: string, port: number, login: boolean = true) => {
// 	const { secureServer, expressApp } = createSecureServer(port)
// 	expressApp.use('/', express.static(path));
// 	// if (login) {
// 	//     expressApp.use(basicAuth({ 
// 	//         authorizer: staticServerAuthLogic,
// 	//         challenge: true,
// 	//         authorizeAsync: true,
// 	//     })) 
// 	// }

// 	log(` ==> Static Server for ${path} running at localhost:${port}/`);
// }
