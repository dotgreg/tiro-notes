import {sharedConfig} from '../../shared/shared.config';
import { listenForSocketRoutes } from './managers/socket/socket.manager';
import { backConfig } from './config.back';
import { getFolderHierarchy } from './managers/dir.manager';
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

const { networkInterfaces } = require('os');
const nets = networkInterfaces();
const results = Object.create(null); // or just '{}', an empty object

// for (const name of Object.keys(nets)) {
//     for (const net of nets[name]) {
//         // skip over non-ipv4 and internal (i.e. 127.0.0.1) addresses
//         if (net.family === 'IPv4' && !net.internal) {
//             if (!results[name]) {
//                 results[name] = [];
//             }

//             results[name].push(net.address);
//             console.log(results);
            
//         }
//     }
// }

// require('dns').lookup(require('os').hostname(), function (err, add, fam) {
//   console.log('addr: '+add);
// })


const http = require('http');
http.get({host: 'ipv4bot.whatismyipaddress.com', port: 80,path: '/'} , (res) => {
  res.on("data", (ipAddress) => {
    console.log("BODY: " + ipAddress);
    http.get({host: `ip-api.com/json/${ipAddress}`, port: 80,path: '/'} , (res) => {
      console.log(res);
    }).on('error', (e) => {
      console.log("error2: " + e.message); 
    });;
  }).on('error', (e) => {
    console.log("error1: " + e.message);
  });
});



// getFolderHierarchy(`${backConfig.dataFolder}2`)
// let tree = getFolderHierarchy(`${backConfig.dataFolder}`)
// console.log(JSON.stringify(tree));
