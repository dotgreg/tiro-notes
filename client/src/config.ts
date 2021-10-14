import {sharedConfig} from '../../shared/shared.config';

export const configClient = {
    log: {
        socket: true,
        eventManager: true,
        upload: false,
    },
    version: '20.13 StableRabbit 12/10/2021',
    global: {
        protocol: '//',
        url: `${window.location.hostname}`,
        port: window.location.port === '80' ? '' : `:${window.location.port}`
    },
    params: {
        previewArea: {
            scrollSpeed: 1.3
        }
    }
}