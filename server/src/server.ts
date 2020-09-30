import {sharedConfig} from '../../shared/shared.config';
import { listenForSocketRoutes } from './managers/socket/socket.manager';
import { backConfig } from './config.back';
import { mediaScan } from './managers/mediaScan.manager';
import { config } from 'process';


console.log('===== SERVER STARTING ======', sharedConfig) 

//
// SOCKET SERVER
//
export const ioServer:SocketIO.Server = require('socket.io')(sharedConfig.socketServerPort, {
  path: '/',
});

listenForSocketRoutes();

//
// MEDIADIR SCAN & MANAGEMENT
//


// mediaDirMain(backConfig.internalPath);
mediaScan(backConfig.internalPath).then((files) => {
  // console.log(files);
});

const serve = require('koa-static');
const mount = require('koa-mount');
const Koa = require('koa');
const app = new Koa();
app.use(serve(backConfig.internalPath));
// app.use(serve(`${backConfig.internalPath}/${backConfig.dbDirName}`));
// app.use(mount('/dist', serve(`${backConfig.internalPath}`, {defer: true})));
app.listen(backConfig.staticFolderPort);










// (async () => {
//   scanDir('../../../testDirTxt').then(files => {
//     console.log(files);
//   }).catch((err) => {
//     console.log(err);
//   })
//   console.log( );
  
//   // console.log(await imageScrape('bananas'));
//   // console.log(await imageScrape('orange'));
//   // console.log(await imageScrape('auberge espagnole'));
// })();

(async () => {
  // console.log(await imageScrape('orange'))
})()