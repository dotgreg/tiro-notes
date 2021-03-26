import {sharedConfig} from '../../shared/shared.config';

export const configClient = {
    log: {
        socket: true,
        eventManager: true,
    },
    version: 'build 18.8 25/03/2021',
    global: {
        socketPort: sharedConfig.socketServerPort,
        socketUrl: window.location.hostname,
        protocol: 'https',

        staticPort: sharedConfig.staticServerPort,
        staticUrl: window.location.hostname,

        frontendPort: sharedConfig.frontendServerPort,
        frontendUrl: window.location.hostname,
    }
}