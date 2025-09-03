import React, { useEffect, useRef } from 'react';
import { getTsFromString, iADate, tsToIADate } from '../../managers/date.manager';
import { getApi } from './api.hook';
import { isNumber } from 'lodash-es'

//
// INTERFACES
//

// like [2022,02,11]
type iEventsCount = { [eventName: string]: number }
// interface iAReport {
// 	start: iADate
// 	end: iADate
// 	eventsCount: iEventsCount
// }
interface iAnalyticsObj {
	[year: number]: {
		[month: number]: {
			[day: number]: {
				[eventName: string]: number
			}
		}
	}
}

export interface iAnalyticsApi {
	log: (logId: string) => void
	report: (
		cb: (o: iAnalyticsObj) => void,
		opt?: {
			start?: iADate,
			end?: iADate,
		}) => void
}


let cacheId = `tiro-analytics`
const getAnalytics = (cb: (o: iAnalyticsObj) => void) => {
	getApi(api => {
		api.cache.get(cacheId, c => {
			let res: iAnalyticsObj = {}
			if (c) res = c as iAnalyticsObj
			cb(res)
		})
	})
}
const setAnalytics = (newObj: iAnalyticsObj) => {
	getApi(api => {
		api.cache.set(cacheId, newObj, -1)
	})
}





//
// EXPORT 
//
export const aLog: iAnalyticsApi['log'] = logId => {
	const d = tsToIADate()
	getAnalytics(o => {
		let no: iAnalyticsObj = { ...o }
		if (!no[d[0]]) no[d[0]] = {}
		if (!no[d[0]][d[1]]) no[d[0]][d[1]] = {}
		if (!no[d[0]][d[1]][d[2]]) no[d[0]][d[1]][d[2]] = {}

		if (!isNumber(no[d[0]][d[1]][d[2]][logId])) no[d[0]][d[1]][d[2]][logId] = 1
		else no[d[0]][d[1]][d[2]][logId]++

		setAnalytics(no)
	})
}

export const aReport: iAnalyticsApi['report'] = (cb, opts) => {
	if (!opts) opts = {}
	let start1: iADate = !opts.start ? tsToIADate(getTsFromString("lastMonth")) : opts.start
	let end1: iADate = !opts.end ? tsToIADate() : opts.end

	getAnalytics(o => {
		// let eventsCount: iEventsCount = {}
		cb(o)
	})
}

//
// API EXPORT 
//
export const useAnalyticsApi = (p: {}) => {
	const api: iAnalyticsApi = { log: aLog, report: aReport }
	return api
}
