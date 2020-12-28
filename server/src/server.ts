import {sharedConfig} from '../../shared/shared.config';
import { listenForSocketRoutes } from './managers/socket/socket.manager';
import { backConfig } from './config.back';
import { startStaticServer2 } from './managers/staticServer.manager';
import { getFolderHierarchySync, workerGetFolderHierarchy } from './managers/dir.manager';
import { triggerWorker } from './managers/workers/worker.manager';
import { iFolder } from '../../shared/types.shared';

console.log('===== SERVER STARTING ======', sharedConfig) 

//
// SOCKET SERVER
//
export const ioServer:SocketIO.Server = require('socket.io')(sharedConfig.socketServerPort, {
  path: '/',
  secure: true,
});

listenForSocketRoutes();

startStaticServer2(backConfig.dataFolder); 
// triggerWorker('getFolderHierarchySync', {folder: '../../data'}, (folder:iFolder) => {
//   console.log('from worker in main <3', folder);
// })  
  