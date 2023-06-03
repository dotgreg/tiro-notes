import React, { useEffect } from 'react';
import { clientSocket2 } from '../../managers/sockets/socket.manager';
import { getLoginToken } from '../app/loginToken.hook';
import { genIdReq, iApiEventBus } from './api.hook';


//
// INTERFACES
//
export interface iPerformanceApi {
	getReport: (
		cb?: (report: any) => void,
	) => void
}

export const usePerformanceApi = (p: {
	eventBus: iApiEventBus
}) => {
	const h = `[PERF API]`

	useEffect(() => {
		clientSocket2.on('getPerformanceReport', (data) => {
			p.eventBus.notify(data.idReq, data)
		})
	}, [])

	const getReport: iPerformanceApi['getReport'] = (cb) => {
		const idReq = genIdReq('get-perf-report');
		// 1. add a listener function
		p.eventBus.subscribe(idReq, answer => {
			if (cb) cb(answer)
			else {
				console.log(h, "report")
				console.log(answer.report)
			}
		});
		// 2. emit request 
		clientSocket2.emit('askPerformanceReport', { token: getLoginToken(), idReq})
	}

	//
	// EXPORTS
	//
	const performanceApi: iPerformanceApi = {
		getReport
	}

	return performanceApi
}

