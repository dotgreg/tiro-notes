import {sharedConfig} from '../../shared/shared.config';

export const configClient = {
    log: {
        socket: true,
        eventManager: true,
    },
    version: 'build 17.5 19/02/2021',
    global: {
        socketPort: sharedConfig.socketServerPort,
        socketUrl: window.location.hostname,

        staticPort: sharedConfig.staticServerPort,
        staticUrl: window.location.hostname,

        frontendPort: sharedConfig.frontendServerPort,
        frontendUrl: window.location.hostname,
    }
}