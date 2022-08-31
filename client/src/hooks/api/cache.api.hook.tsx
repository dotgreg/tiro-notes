import React, { useEffect, useRef, useState } from 'react';
import { sharedConfig } from '../../../../shared/shared.config';
import { safeString } from '../../managers/string.manager';
import { getClientApi2, iApiEventBus } from './api.hook';

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
		contentToCache: any
	) => void

}


const cacheFolderPath = `/${sharedConfig.path.configFolder}/${sharedConfig.path.cacheFolder}/cache-api`

interface iCachedDic {
	[cacheId: string]: any
}

export const useCacheApi = (p: {
}): iCacheApi => {
	const h = `[CACHE API] 00963 `

	const getCachedStorage = (cacheId) => `${cacheFolderPath}/cache-api-storage-${safeString(cacheId)}.md`

	const cachedRamDic = useRef<iCachedDic>({})

	const debug = false

	const getCache: iCacheApi['get'] = async (cacheId, cb) => {

		// console.log(3331, cachedRamDic.current, getCachedStorage(cacheId));
		// if presennt in RAM
		if (cacheId in cachedRamDic.current) {
			if (debug) console.log(3331, 'FROM RAM', cacheId);
			cb(cachedRamDic.current[cacheId])
		} else {
			if (debug) console.log(3331, 'FROM FILE', cacheId);
			// else fetch it from file
			getClientApi2().then(api => {
				api.file.getContent(getCachedStorage(cacheId), raw => {
					const obj = JSON.parse(raw)
					cachedRamDic.current[cacheId] = obj
					cb(cachedRamDic.current[cacheId])
				}, {
					onError: e => {
						// if doesnt exists, return undefined
						if (e === 'NO_FILE') {
							if (debug) console.log(3331, 'FROM FILE: NO_FILE', cacheId);
							cachedRamDic.current[cacheId] = undefined
							cb(cachedRamDic.current[cacheId])
						}
					}
				})
			})
		}
	}

	const setCache: iCacheApi['set'] = (cacheId, cacheContent) => {

		cachedRamDic.current[cacheId] = cacheContent

		getClientApi2().then(api => {
			api.file.saveContent(getCachedStorage(cacheId), JSON.stringify(cacheContent))
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
