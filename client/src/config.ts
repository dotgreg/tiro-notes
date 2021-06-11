import {sharedConfig} from '../../shared/shared.config';

export const configClient = {
    log: {
        socket: true,
        eventManager: true,
    },
    version: 'build 20.10b3 10/06/2021',
    global: {
        protocol: '//',
        url: `${window.location.hostname}`,
        port: window.location.port === '80' ? '' : `:${window.location.port}`
    }
}