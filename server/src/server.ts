import {sharedConfig} from '../../shared/shared.config';
import { initSocketLogic } from './managers/socket.manager';
import { backConfig } from './config.back';
import { startStaticServer } from './managers/staticServer.manager';
import { getPlatform } from './managers/platform.manager';
import { createSecureServer } from './ssl.manager';
import { isEnvDev } from './managers/path.manager';

console.log(`===== SERVER STARTING ====== (isEnvDev: ${isEnvDev()}, platform: ${getPlatform()})`, backConfig) 

//
// SOCKET SERVER
//
const {secureServer, expressApp} = createSecureServer(sharedConfig.socketServerPort, ()=>{}, 'socket server')
export const ioServer:SocketIO.Server = require('socket.io')(secureServer, { 
  path: '/',
  secure: true,
  serveClient: false 
});

initSocketLogic();

startStaticServer(backConfig.frontendBuildFolder, sharedConfig.frontendServerPort); 

if (backConfig.dataFolder) startStaticServer(backConfig.dataFolder, sharedConfig.staticServerPort, false); 
