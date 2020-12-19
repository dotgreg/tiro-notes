import {sharedConfig} from '../../shared/shared.config';
import { listenForSocketRoutes } from './managers/socket/socket.manager';
import { backConfig } from './config.back';
import { startStaticServer } from './managers/staticServer.manager';

console.log('===== SERVER STARTING ======', sharedConfig) 

//
// SOCKET SERVER
//
export const ioServer:SocketIO.Server = require('socket.io')(sharedConfig.socketServerPort, {
  path: '/',
});

listenForSocketRoutes();

startStaticServer(backConfig.dataFolder)
