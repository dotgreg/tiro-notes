import { sharedConfig } from '../../shared/shared.config';

export const configClient = {
	...sharedConfig.client,
	global: {
		protocol: '//',
		url: `${window.location.hostname}`,
		port: window.location.port === '80' ? '' : `:${window.location.port}`
	},
}
