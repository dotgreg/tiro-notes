import {sharedConfig} from '../../shared/shared.config';
import { listenForSocketRoutes } from './managers/socket/socket.manager';
import { backConfig } from './config.back';
import { getFolderHierarchy } from './managers/dir.manager';

console.log('===== SERVER STARTING ======', sharedConfig) 

//
// SOCKET SERVER
//
export const ioServer:SocketIO.Server = require('socket.io')(sharedConfig.socketServerPort, {
  path: '/',
});

listenForSocketRoutes();

// getFolderHierarchy(`${backConfig.dataFolder}2`)
// let tree = getFolderHierarchy(`${backConfig.dataFolder}`)
// console.log(JSON.stringify(tree));
