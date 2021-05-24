import {sharedConfig} from '../../shared/shared.config';

export const configClient = {
    log: {
        socket: true,
        eventManager: true,
    },
    version: 'build 20.7.1 23/05/2021',
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