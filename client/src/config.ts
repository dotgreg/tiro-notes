import {sharedConfig} from '../../shared/shared.config';

export const configClient = {
    log: {
        socket: true,
        eventManager: true,
        upload: false,
    },
    version: '0.25 10/03/2022',
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
