import React, { useEffect } from 'react';
import { iActivityReport, iActivityReportParams } from '../../../../shared/types.shared';
import { clientSocket2 } from '../../managers/sockets/socket.manager';
import { getLoginToken } from '../app/loginToken.hook';
import { genIdReq, iApiEventBus } from './api.hook';
import { extractDocumentation } from '../../managers/apiDocumentation.manager';


//
// INTERFACES
//
export interface iActivityApi {
	getReport: (
		params?:iActivityReportParams,
		cb?: (report: iActivityReport) => void,
	) => void,
	documentation: () => any
}

export const useActivityApi = (p: {
	eventBus: iApiEventBus
}) => {
	const h = `[ACTIVITY API]`

	useEffect(() => {
		clientSocket2.on('getActivityReport', (data) => {
			// console.log(111, data)
			p.eventBus.notify(data.idReq, data)
		})
	}, [])

	const getReport: iActivityApi['getReport'] = (params, cb) => {
		console.log(h,"asked for report (if no cb provided, will be outputed to console.log)", params)
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
		clientSocket2.emit('askActivityReport', { 
			params,
			token: getLoginToken(), 
			idReq
		})
	}

	//
	// EXPORTS
	//
	const ActivityApi: iActivityApi = {
		getReport,
		documentation: () => ""
	}
	ActivityApi.documentation = () => extractDocumentation( ActivityApi, "api.activity", "client/src/hooks/api/activity.api.hook.tsx");

	return ActivityApi
}

