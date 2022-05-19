import { each } from "lodash";

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

	console.log(`[IP SCAN] => `, resultsFlat);
	return resultsFlat
}
