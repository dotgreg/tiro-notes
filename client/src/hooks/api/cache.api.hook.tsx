import { isString } from 'lodash';
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
		cacheMin?: number,
		cb?: (res:any) => void
	) => void

	cleanRamCache: () => void

}


const cacheFolderPath = `/${sharedConfig.path.configFolder}/${sharedConfig.path.cacheFolder}/cache-api`

interface iCachedDic {
	[cacheId: string]: { until: number, content: any }
}

const h = `[CACHE API]`
let log = sharedConfig.client.log.verbose
let logChunk = sharedConfig.client.log.verbose
// let logChunk = true


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

	//////////////////////////////////////////////////////////////////////////////////
	// RAM
	//
	const getCachedStorage = (cacheId: string) => `${cacheFolderPath}/cache-api-storage-${safeString(cacheId)}.md`
	const cachedRamDic = useRef<iCachedDic>({})

	//////////////////////////////////////////////////////////////////////////////////
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
			getFileContentInChunks(cacheId, raw => {
				// getApi(api => {
				// api.file.getContent(getCachedStorage(cacheId), raw => {
				try {
					const cachedObjRw = JSON.parse(raw)
					cachedRamDic.current[cacheId] = { ...cachedObjRw }

					// if expired, update its value
					let cacheObj = cachedRamDic.current[cacheId]
					let expired = isExpired(cacheObj.until)
					if (expired) cacheObj.content = undefined

					log && console.log(h, 'FROM FILE', cacheId, " expired:", expired);
					cb(cacheObj.content)
				} catch (e) {
					log && console.log(h, 'error getting cache', e, cacheId);
					setRamCache(cacheId, undefined, 60)
					cb(cachedRamDic.current[cacheId].content)
				}
			}, e => {
				// if doesnt exists, return undefined to avoid unnecessary api.getcontent calls
				if (e === 'NO_FILE') {
					log && console.log(h, 'FROM FILE: NO_FILE', cacheId);
					setRamCache(cacheId, undefined, 60)
					cb(cachedRamDic.current[cacheId].content)
				}
			}
			)
		}
	}


	//////////////////////////////////////////////////////////////////////////////////
	// SETTING LOGIC
	//
	const setRamCache = (cacheId: string, cacheContent: any, cachedMin: number) => {
		cachedRamDic.current[cacheId] = { content: cacheContent, until: getDateUntil(cachedMin) }
	}
	const setCache: iCacheApi['set'] = (cacheId, cacheContent, cachedMin, cb) => {
		if (!cachedMin) cachedMin = 60
		if (cachedMin === -1) cachedMin = 99999999999999999999999999999999
		setRamCache(cacheId, cacheContent, cachedMin)
		const nObj = cachedRamDic.current[cacheId]

		log && console.log(h, 'SETTING', cacheId, " with cachedTime in min", cachedMin);
		saveFileContentInChunks(cacheId, nObj, res => {cb && cb(res)})
	}















	//////////////////////////////////////////////////////////////////////////////////
	// TRANSPARENT CACHE CHUNKING SYSTEM
	// Send/Receive logic (with chunker if content too large) 
	// as many servers only supports by default 1MB upload limit
	//
	const limitChunk = 500 * 1000 // first nb in KB
	const chunkHeader = `__CHUNKED__CACHED__OBJ__SIZE:`
	const chunkString = (str, length) => str.match(new RegExp('.{1,' + length + '}', 'g'));
	const hc = `[CACHE CHUNK]`

	//
	// SET CHUNKS
	//
	const saveFileContentInChunks = (cacheId, obj, allSavedCb?:Function) => {
		const contentStr = JSON.stringify(obj)

		const saveFile = (id: string, str: string, cb:Function) => {
			logChunk && console.log(hc, getCachedStorage(id), { str })
			getApi(api => {
				api.file.saveContent(getCachedStorage(id), `${str}`, {}, res => {cb(res)})
			})
		}

		

		if (contentStr.length > limitChunk) {
			// chunk content in 100k blocks
			let contentArr = chunkString(contentStr, limitChunk)
			logChunk && console.log(hc, `SAVE >> TOO LARGE, split in ${contentArr.length} parts`, { cacheId, contentArr })


			let saveSuccessCount = 0
			const onOneFileSaved = () => {
				saveSuccessCount++
				if (saveSuccessCount === contentArr.length - 1 && allSavedCb) allSavedCb()
			}
			
			// the first content chunk
			saveFile(cacheId, `${chunkHeader}${contentArr.length}`, onOneFileSaved)
			for (let i = 0; i < contentArr.length; i++) {
				// save all contents chunks
				setTimeout(() => {
					saveFile(`c${i}_${cacheId}`, contentArr[i], onOneFileSaved)
				}, 200 * i)
			}
		} else {
			return saveFile(cacheId, contentStr, () => {if (allSavedCb) allSavedCb()})
		}
	}

	//
	// GET CHUNKS
	//
	const getFileContentInChunks = (cacheId, cb, err) => {
		const getFile = (path, onSuccess, onError) => { getApi(api => { api.file.getContent(getCachedStorage(path), onSuccess, { onError }) }) }

		// if that one is an obj with specif prop, get the nb and finally get all files and merge obj
		const failChunkLoad = "___ERROR___CHUNK___LOADING___FAILURE"
		const getAllChunksAndMerge = (id, nbChunks, cb1, err1) => {
			let resAllArr: string[] = []
			const onAllChunksLoaded = () => {
				if (resAllArr.length === nbChunks) {
					let resMerge = resAllArr.join('')
					let hasFailed = resMerge.includes(failChunkLoad)
					logChunk && console.log(`GET >> RESULT remerging`, { hasFailed, cacheId, nbChunks, resMerge })
					if (hasFailed) err1()
					else cb1(resMerge)
				}
			}

			for (let i = 0; i < nbChunks; i++) {
				getFile(`c${i}_${cacheId}`, r => {
					resAllArr[i] = r
					logChunk && console.log(hc, `c${i}_${cacheId}`, { nb: resAllArr.length, nbChunks, r })
					onAllChunksLoaded()
				}, e => {
					resAllArr[i] = failChunkLoad
					onAllChunksLoaded()
				})

			}
		}


		// first el is JSON starts with chunkHeader
		getFile(cacheId, r => {
			try {
				if (r.startsWith(chunkHeader)) {
					let nbChunks = parseInt(r.replaceAll(chunkHeader, ""))
					logChunk && console.log(h, `GET >> remerging a ${nbChunks} part`, { cacheId })
					getAllChunksAndMerge(cacheId, nbChunks, rAll => { cb(rAll) }, e => { err() })
				} else {
					cb(r)
				}
			} catch (error) {
				err(error)
			}
		}, e => {
			err(e)
		})
	}



	const cleanRamCache = () => {
		cachedRamDic.current = {}
	}





	//
	// EXPORTS
	//
	return {
		get: getCache,
		set: setCache,
		cleanRamCache
	}
}
