import React, { useEffect, useRef } from 'react';
import { getTsFromString, iADate, tsToIADate } from '../../managers/date.manager';
import { getApi } from './api.hook';

//
// INTERFACES
//

// like [2022,02,11]
type iEventsCount = { [eventName: string]: number }
interface iAReport {
	start: iADate
	end: iADate
	eventsCount: iEventsCount
}
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
	report: (start?: iADate, end?: iADate) => iAReport
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

export const useAnalyticsApi = (p: {}) => {

	const log: iAnalyticsApi['log'] = logId => {
		const d = tsToIADate()
		getAnalytics(o => {
			let no: iAnalyticsObj = { ...o }
			if (!no[d[0]]) no[d[0]] = {}
			if (!no[d[0]][d[1]]) no[d[0]][d[1]] = {}
			if (!no[d[0]][d[1]][d[2]]) no[d[0]][d[1]][d[2]] = {}

			if (!no[d[0]][d[1]][d[2]][logId]) no[d[0]][d[1]][d[2]][logId] = 0
			else no[d[0]][d[1]][d[2]][logId]++


		})
	}

	const report: iAnalyticsApi['report'] = (start, end) => {
		let start1: iADate = !start ? tsToIADate(getTsFromString("lastMonth")) : start
		let end1: iADate = !end ? tsToIADate() : end
		let eventsCount: iEventsCount = {}
		return { start: start1, end: end1, eventsCount }
	}

	//
	// EXPORTS
	//
	const api: iAnalyticsApi = {
		log,
		report
	}

	return api
}
