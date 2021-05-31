import {sharedConfig} from '../../shared/shared.config';

export const configClient = {
    log: {
        socket: true,
        eventManager: true,
    },
    version: 'build 20.9.1 31/05/2021',
    global: {
        // socketPort: sharedConfig.socketServerPort,
        // socketUrl: window.location.hostname,
        // protocol: 'https',
        protocol: '//',
        url: `${window.location.hostname}`,
        port: window.location.port === '80' ? '' : `:${window.location.port}`

        // staticPort: sharedConfig.staticServerPort,
        // staticUrl: window.location.hostname,

        // frontendPort: sharedConfig.frontendServerPort,
        // frontendUrl: window.location.hostname,
    }
}