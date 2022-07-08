import { backConfig } from "../config.back";
import { log } from "./log.manager";
import { getLoginToken } from "./loginToken.manager";


var serveStatic = require('serve-static');
var finalhandler = require('finalhandler')

export const startSecuredStaticServer = (p: { expressApp: any, url: string, pathFolder: string }) => {

	var serve = serveStatic(p.pathFolder, {acceptRanges: true});

	p.expressApp.use(p.url, (req, res) => {
		let isTokenCorrect = false
		if (req.query.token && req.query.token === getLoginToken()) isTokenCorrect = true

		if (isTokenCorrect || backConfig.dev.disableLogin) {
			serve(req, res, finalhandler(req, res))
		} else {
			log(`[STATIC SERVER] error: requested a resource with login token either absent or wrong, ${req.url}, ${req.query.token}`);
		}

	});
}


