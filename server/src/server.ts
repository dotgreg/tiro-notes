import {sharedConfig} from '../../shared/shared.config';
import { listenForSocketRoutes } from './managers/socket/socket.manager';
import { backConfig, isEnvDev } from './config.back';
import { startStaticServer } from './managers/staticServer.manager';
import { getPlatform } from './managers/platform.manager';
import { createSecureServer } from './ssl.manager';

console.log(`===== SERVER STARTING ====== (isEnvDev: ${isEnvDev()}, platform: ${getPlatform()})`, sharedConfig) 
// open('http://192.168.43.1:3023');

//
// SOCKET SERVER
//
const {secureServer, expressApp} = createSecureServer(sharedConfig.socketServerPort, ()=>{}, 'socket server')
export const ioServer:SocketIO.Server = require('socket.io')(secureServer, { 
  path: '/',
  secure: true,
  serveClient: false 
});

listenForSocketRoutes();

startStaticServer(backConfig.dataFolder, sharedConfig.staticServerPort, false); 
startStaticServer(backConfig.frontendBuildFolder, sharedConfig.frontendServerPort); 
