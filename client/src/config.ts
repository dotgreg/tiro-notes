import {sharedConfig} from '../../shared/shared.config';

export const configClient = {
    log: {
        socket: true,
        eventManager: true,
        upload: false,
    },
    version: 'build 20.12 13/07/2021',
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