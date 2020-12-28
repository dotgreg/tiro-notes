"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ioServer = void 0;
const shared_config_1 = require("../../shared/shared.config");
const socket_manager_1 = require("./managers/socket/socket.manager");
const config_back_1 = require("./config.back");
const staticServer_manager_1 = require("./managers/staticServer.manager");
console.log('===== SERVER STARTING ======', shared_config_1.sharedConfig);
//
// SOCKET SERVER
//
exports.ioServer = require('socket.io')(shared_config_1.sharedConfig.socketServerPort, {
    path: '/',
    secure: true,
});
socket_manager_1.listenForSocketRoutes();
staticServer_manager_1.startStaticServer2(config_back_1.backConfig.dataFolder);
const { Worker } = require('worker_threads');
const worker = new Worker('./src/worker.js');
worker.on('message', (msg) => { console.log(msg); });
// console.log('yooooo from local');
// setInterval(async () => {
//   let folder = await workerGetFolderHierarchy(backConfig.dataFolder) 
//   console.log(`RESULT FROM WORKER`,folder);
//   // let folder = await getFolderHierarchySync(backConfig.dataFolder) 
//   // console.log(`RESULT FROM NORMAL`,folder);
//   // console.log('====> startOnAnotherThread start');
//   //   startOnAnotherThread(async () => {
//   //         // return await getFolderHierarchySync(`${backConfig.dataFolder}`)
//   //   }).then((folder) => {
//   //       console.log('startOnAnotherThread end',folder);
//   //   })
// }, 6000)
