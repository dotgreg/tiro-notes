import {sharedConfig} from '../../shared/shared.config';

export const configClient = {
    log: {
        socket: true,
        eventManager: true,
    },
    version: 'build 4 18/12/2020',
    global: {
        socketPort: sharedConfig.socketServerPort,
        socketUrl: 'localhost',
    }
}