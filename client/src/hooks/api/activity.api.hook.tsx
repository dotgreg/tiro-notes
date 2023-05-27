import React, { useEffect } from 'react';
import { iActivityReport } from '../../../../shared/types.shared';
import { clientSocket2 } from '../../managers/sockets/socket.manager';
import { getLoginToken } from '../app/loginToken.hook';
import { genIdReq, iApiEventBus } from './api.hook';


//
// INTERFACES
//
export interface iActivityApi {
	getReport: (
		cb?: (report: iActivityReport) => void,
	) => void
}

export const useActivityApi = (p: {
	eventBus: iApiEventBus
}) => {
	const h = `[ACTIVITY API]`

	useEffect(() => {
		clientSocket2.on('getActivityReport', (data) => {
			p.eventBus.notify(data.idReq, data)
		})
	}, [])

	const getReport: iActivityApi['getReport'] = (cb) => {
		const idReq = genIdReq('get-perf-report');
		// 1. add a listener function
		p.eventBus.subscribe(idReq, answer => {
			if (cb) cb(answer)
			else {
                // if not cb, just console.log it
				console.log(h, "report")
				console.log(answer.report)
			}
		});
		// 2. emit request 
		clientSocket2.emit('askActivityReport', { token: getLoginToken(), idReq})
	}

	//
	// EXPORTS
	//
	const ActivityApi: iActivityApi = {
		getReport
	}

	return ActivityApi
}

