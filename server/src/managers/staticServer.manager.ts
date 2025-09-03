import { backConfig } from "../config.back";
import { log } from "./log.manager";
import { getUserFromToken } from "./loginToken.manager";


var serveStatic = require('serve-static');
var finalhandler = require('finalhandler')

export const startSecuredStaticServer = (p: { expressApp: any, url: string, pathFolder: string, cacheFront:boolean }) => {
  var serve = serveStatic(p.pathFolder, {
    acceptRanges: true,
    setHeaders: (res, path) => {
      if (path.endsWith('.js') || path.endsWith('.css')) {
        if (p.cacheFront) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  });

  p.expressApp.use(p.url, (req, res) => {
    let isTokenCorrect = false;
    // should include a token (viewer or editor are good)
    let user = getUserFromToken(req.query.token);
    if (req.query.token && user && user.roles.includes('viewer')) isTokenCorrect = true;

    if (isTokenCorrect || backConfig.dev.disableLogin) {
      serve(req, res, finalhandler(req, res));
    } else {
      log(`[STATIC SERVER] error: requested a resource with login token either absent or wrong, ${req.url}, ${req.query.token}`);
      res.status(403);
      res.send(403);
    }
  });
};
// export const startSecuredStaticServer = (p: { expressApp: any, url: string, pathFolder: string }) => {

// 	var serve = serveStatic(p.pathFolder, { acceptRanges: true });

// 	p.expressApp.use(p.url, (req, res) => {
// 		let isTokenCorrect = false
// 		// should include a token (viewer or editor are good)
// 		let user = getUserFromToken(req.query.token)
// 		if (req.query.token && user && user.roles.includes("viewer")) isTokenCorrect = true

// 		if (isTokenCorrect || backConfig.dev.disableLogin) {
// 			serve(req, res, finalhandler(req, res))
// 		} else {
// 			log(`[STATIC SERVER] error: requested a resource with login token either absent or wrong, ${req.url}, ${req.query.token}`);
// 			// return res
// 			// return res.status(403).render('403');
// 			res.status(403);
// 			res.send(403);
// 		}

// 	});
// }


