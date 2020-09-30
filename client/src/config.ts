import {sharedConfig} from '../../shared/shared.config';

export const cnf = {
    log: {
        socket: true,
        eventManager: true,
    },
    global: {
        socketPort: sharedConfig.socketServerPort,
        socketUrl: 'localhost',
    }
}