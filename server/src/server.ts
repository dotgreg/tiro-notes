import {sharedConfig} from '../../shared/shared.config';
import { listenForSocketRoutes } from './managers/socket/socket.manager';
import { backConfig, isEnvDev } from './config.back';
import { startStaticServer } from './managers/staticServer.manager';

console.log(`===== SERVER STARTING ====== (isEnvDev: ${isEnvDev()}})`, sharedConfig) 
// open('http://192.168.43.1:3023');

//
// SOCKET SERVER
//
export const ioServer:SocketIO.Server = require('socket.io')(sharedConfig.socketServerPort, {
  path: '/',
  secure: true,
  serveClient: false 
});

listenForSocketRoutes();

startStaticServer(backConfig.dataFolder, sharedConfig.staticServerPort, false); 
startStaticServer(backConfig.frontendBuildFolder, sharedConfig.frontendServerPort); 
