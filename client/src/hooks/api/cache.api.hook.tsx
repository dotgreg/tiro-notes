import React, { useEffect, useRef, useState } from 'react';
import { sharedConfig } from '../../../../shared/shared.config';
import { safeString } from '../../managers/string.manager';
import { getActiveTabIndex } from '../app/tabs.hook';
import { getApi, getClientApi2, iApiEventBus } from './api.hook';

//
// INTERFACES
//

// MAIN
export interface iCacheApi {

	get: (
		cacheId: string,
		cb: (cacheContent: any) => void
	) => void

	set: (
		cacheId: string,
		contentToCache: any,
		cachedMin: number
	) => void

}


const cacheFolderPath = `/${sharedConfig.path.configFolder}/${sharedConfig.path.cacheFolder}/cache-api`

interface iCachedDic {
	[cacheId: string]: { until: number, content: any }
}

const h = `[CACHE API]`
const log = sharedConfig.client.log.verbose
// const log = false


const now = () => new Date().getTime()
const getDateUntil = (minutes: number): number => {
	let res = now() + (minutes * 60 * 1000)
	return res
}
const isExpired = (date: number) => {
	let res = (date - now()) < 0
	log && console.log(h, "isExpired? : ", res, (date - now()) / (60 * 1000), "mins")
	return res
}


export const useCacheApi = (p: {}): iCacheApi => {

	//
	// RAM
	//
	const getCachedStorage = (cacheId: string) => `${cacheFolderPath}/cache-api-storage-${safeString(cacheId)}.md`
	const cachedRamDic = useRef<iCachedDic>({})

	//
	// GETTING LOGIC
	//
	const getCache: iCacheApi['get'] = (cacheId, cb: (content: any) => void) => {
		// if present in RAM
		if (cacheId in cachedRamDic.current) {
			// if expired, update its value
			let cacheObj = cachedRamDic.current[cacheId]
			let expired = isExpired(cacheObj.until)
			if (expired) cacheObj.content = undefined

			log && console.log(h, 'FROM RAM', cacheId, " expired:", expired);
			cb(cacheObj.content)
		} else {
			// else fetch it from file
			getApi(api => {
				api.file.getContent(getCachedStorage(cacheId), raw => {
					const obj = JSON.parse(raw)
					cachedRamDic.current[cacheId] = obj


					// if expired, update its value
					let cacheObj = cachedRamDic.current[cacheId]
					let expired = isExpired(cacheObj.until)
					if (expired) cacheObj.content = undefined

					log && console.log(h, 'FROM FILE', cacheId, " expired:", expired);
					cb(cacheObj.content)

				}, {
					onError: e => {
						// if doesnt exists, return undefined to avoid unnecessary api.getcontent calls
						if (e === 'NO_FILE') {
							log && console.log(h, 'FROM FILE: NO_FILE', cacheId);
							setRamCache(cacheId, undefined, 60)
							cb(cachedRamDic.current[cacheId].content)
						}
					}
				})
			})
		}
	}


	//
	// SETTING LOGIC
	//
	const setRamCache = (cacheId: string, cacheContent: any, cachedMin: number) => {
		cachedRamDic.current[cacheId] = { content: cacheContent, until: getDateUntil(cachedMin) }
	}
	const setCache: iCacheApi['set'] = (cacheId, cacheContent, cachedMin) => {
		if (!cachedMin) cachedMin = 60
		if (cachedMin === -1) cachedMin = 99999999999999999999999999999999
		setRamCache(cacheId, cacheContent, cachedMin)
		const nObj = cachedRamDic.current[cacheId]

		log && console.log(h, 'SETTING', cacheId, " with cachedTime in min", cachedMin);
		getClientApi2().then(api => {
			api.file.saveContent(getCachedStorage(cacheId), JSON.stringify(nObj))
		})
	}

	//
	// EXPORTS
	//
	return {
		get: getCache,
		set: setCache
	}
}
