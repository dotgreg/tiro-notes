import { sharedConfig } from '../../shared/shared.config';

let port = window.location.port === '80' ? '' : `:${window.location.port}`

// if not port, we are probably in jest testing, back port to 3023 by default
// if (!window.location.port || window.location.port === "") port = ':3023'
// actually break prod

// if port 3000, we are probably in dev, back port to 3023 by default
if (window.location.port === "3000") port = ':3023'

export const configClient = {
	...sharedConfig.client,
	global: {
		protocol: `${window.location.protocol}//`,
		url: `${window.location.hostname}`,
		port
	},
}
