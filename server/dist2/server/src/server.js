"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ioServer = void 0;
const shared_config_1 = require("../../shared/shared.config");
const socket_manager_1 = require("./managers/socket/socket.manager");
const config_back_1 = require("./config.back");
const staticServer_manager_1 = require("./managers/staticServer.manager");
console.log('===== SERVER STARTING ======', shared_config_1.sharedConfig);
console.log('hello world');
//
// SOCKET SERVER
//
exports.ioServer = require('socket.io')(shared_config_1.sharedConfig.socketServerPort, {
    path: '/',
    secure: true,
});
socket_manager_1.listenForSocketRoutes();
staticServer_manager_1.startStaticServer2(config_back_1.backConfig.dataFolder);
// triggerWorker('getFolderHierarchySync', {folder: '../../data'}, (folder:iFolder) => {
//   console.log('from worker in main <3', folder);
// })  
