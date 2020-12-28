import {sharedConfig} from '../../shared/shared.config';

export const configClient = {
    log: {
        socket: true,
        eventManager: true,
    },
    version: 'build 8 27/12/2020',
    global: {
        socketPort: sharedConfig.socketServerPort,
        socketUrl: window.location.hostname,
        staticPort: sharedConfig.staticServerPort,
        staticUrl: window.location.hostname,
    }
}