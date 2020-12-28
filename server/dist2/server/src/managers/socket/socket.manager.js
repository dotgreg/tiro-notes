"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listenForSocketRoutes = void 0;
const sockets_events_1 = require("../../../../shared/sockets/sockets.events");
const server_1 = require("../../server");
const shared_config_1 = require("../../../../shared/shared.config");
const routes_1 = require("../../routes");
const upload_manager_1 = require("../upload.manager");
exports.listenForSocketRoutes = () => {
    server_1.ioServer.on(sockets_events_1.socketEvents.connection, (socket, params) => {
        // send connection Success to finish front bootstrap
        shared_config_1.sharedConfig.debug.connection && console.log(`[CONNECTION] new client connected`);
        server_1.ioServer.emit(sockets_events_1.socketEvents.connectionSuccess, { woop: 'wooooop' });
        upload_manager_1.initUploadFileRoute(socket);
        // start listening to all events for that client
        routes_1.socketRoutes.forEach(route => {
            socket.on(route.event, (data) => {
                shared_config_1.sharedConfig.debug.socketEvents && console.log(`[SOCKET SERV EVENT] --> ${route.event} `);
                if (shared_config_1.sharedConfig.debug.socketEvents && !route.disableDataLog)
                    console.log(`with data `, data);
                route.action(socket, data);
            });
        });
    });
};
