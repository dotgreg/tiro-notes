import {sharedConfig} from '../../shared/shared.config';
import { listenForSocketRoutes } from './managers/socket/socket.manager';
import { backConfig } from './config.back';
import { startStaticServer } from './managers/staticServer.manager';
import { getFolderHierarchySync, workerGetFolderHierarchy } from './managers/dir.manager';
import { triggerWorker } from './managers/workers/worker.manager';
import { iFolder } from '../../shared/types.shared';

console.log('===== SERVER STARTING ======', sharedConfig) 
console.log('hello world3');

//
// SOCKET SERVER
//
export const ioServer:SocketIO.Server = require('socket.io')(sharedConfig.socketServerPort, {
  path: '/',
  secure: true,
});

listenForSocketRoutes();

startStaticServer(backConfig.dataFolder, sharedConfig.staticServerPort, false); 
startStaticServer(backConfig.frontendBuildFolder, sharedConfig.frontendServerPort); 
// triggerWorker('getFolderHierarchySync', {folder: '../../data'}, (folder:iFolder) => {
//   console.log('from worker in main <3', folder);
// })  
  