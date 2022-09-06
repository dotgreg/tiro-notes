import { each } from "lodash";
import { sharedConfig } from "../../../shared/shared.config";

const shouldLog = sharedConfig.server.log.verbose
export const getServerIps = (): string[] => {
	const { networkInterfaces } = require('os');
	const nets = networkInterfaces();
	const results = Object.create(null);
	const resultsFlat: string[] = []
	for (const name of Object.keys(nets)) {
		for (const net of nets[name]) {
			if (net.family === 'IPv4' && !net.internal) {
				if (!results[name]) {
					results[name] = [];
				}
				results[name].push(net.address);
				resultsFlat.push(net.address)
			}
		}
	}

	shouldLog && console.log(`[IP SCAN] => `, resultsFlat);
	return resultsFlat
}
