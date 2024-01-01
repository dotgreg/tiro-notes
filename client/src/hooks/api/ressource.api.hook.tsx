import React, { useEffect, useRef } from 'react';
import { getRessourceIdFromUrl } from '../../../../shared/helpers/id.helper';
import { sharedConfig } from '../../../../shared/shared.config';
import { clientSocket2, getBackendUrl } from '../../managers/sockets/socket.manager';
import { getLoginToken } from '../app/loginToken.hook';
import { genIdReq, getApi, iApiEventBus } from './api.hook';
import { checkUrlExists } from '../../managers/url.manager'
import { each, random } from 'lodash';
import { cleanPath } from '../../../../shared/helpers/filename.helper';
import {  getStaticRessourceLink } from '../../managers/ressource.manager';
import { notifLog } from '../../managers/devCli.manager';
import { tryCatch } from '../../managers/tryCatch.manager';
import { iDownloadRessourceOpts, iFile, iImageCompressionParams } from '../../../../shared/types.shared';

export interface iEvalFuncParams {[paramsNames:string]:any}

//
// INTERFACES
//
export interface iRessourceApi {
	delete: (
		filePath: string,
		cb: (answer: any) => void
	) => void,

	download: (
		url: string,
		folder: string,
		cb: (answer: any) => void,
		opts?: iDownloadRessourceOpts
	) => void,

	fetch: (
		url: string,
		cb: (urlContent: string, urlPath:string) => void,
		options? : { 
			disableCache?: boolean | string
			returnsPathOnly?:boolean
		} & iDownloadRessourceOpts
	) => void,
	
	fetchEval: (
		url: string,
		params?: iEvalFuncParams,
		options?: { 
			disableCache?: boolean | string
		} & iDownloadRessourceOpts,
		cb?: (evalRes:any) => void,
	) => void,

	fetchUrlArticle: (
		url: string,
		cb: (out: { title: string, text: string, html: string, raw: string }) => void,
		options?: {} & iDownloadRessourceOpts,
	) => void

	scanFolder: (
		path:string,
		cb: (files: iFile[]) => void
	) => void,

	compressImage: (
		params: iImageCompressionParams,
		cb?: (answer: any) => void
	) => void

	cleanCache: () => void
}

const h = `[RESSOURCE API] `

export const useRessourceApi = (p: {
	eventBus: iApiEventBus
}) => {

	const { eventBus } = { ...p }

	//
	// LISTEN TO SOCKET
	// 
	useEffect(() => {
		clientSocket2.on('getRessourceApiAnswer', data => {
			eventBus.notify(data.idReq, data)
		})
		clientSocket2.on('getRessourceScan', data => {
			eventBus.notify(data.idReq, data)
		})
	}, [])

	//
	// FUNCTIONS
	// 
	const deleteRessource: iRessourceApi['delete'] = (path, cb) => {
		const idReq = genIdReq('delete-ressource');
		console.log(`${h} delete ressource ${path}`);
		// execute callback on answer
		p.eventBus.subscribe(idReq, cb);
		clientSocket2.emit('askRessourceDelete', { path: path, idReq, token: getLoginToken() })
	}

	const downloadRessource: iRessourceApi['download'] = (url, folder, cb, opts) => {
		const idReq = genIdReq('download-ressource');
		// console.log(`${h} downloading ressource url ${url} to folder ${folder}`);
		// execute callback on answer
		p.eventBus.subscribe(idReq, cb);
		clientSocket2.emit('askRessourceDownload', { url, folder, idReq, opts,token: getLoginToken() })
	}


	const fetchRessource: iRessourceApi['fetch'] = (url, cb, options) => {

		if (!options) options = {}
		if (!options.disableCache) options.disableCache = false
		if (!options.returnsPathOnly) options.returnsPathOnly = false
		if (options.disableCache === "false") options.disableCache = false
		if (options.disableCache === "true") options.disableCache = true

		// console.log(h,"FETCH RESSOURCE", {url,opt})

		const cacheFolder = `/.tiro/cache/fetch/`
		let localStaticPath = getStaticRessourceLink(`/${cacheFolder}${getRessourceIdFromUrl(url)}`)

		const returnFile = () => {
			fetch(localStaticPath).then(function (response) {
				return response.text();
			}).then(function (data) {
				tryCatch(() => cb(data, localStaticPath))
			})
		}
		const returnFilePath = () => { cb("", localStaticPath) }

		const downloadThenReturnFile = () => {
			downloadRessource(url, cacheFolder, answer => {
				if (answer.message) { 
					if (!options?.returnsPathOnly) returnFile() 
					else returnFilePath()
				}
			}, options)
		}

		if (options.disableCache === true) {
			downloadThenReturnFile()
		}
		else {
			checkUrlExists({
				url: localStaticPath,
				onSuccess: () => {
					// console.log(`${h} FETCHING => getting CACHED file`, { url, options });
					returnFile()
				},
				onFail: () => {
					downloadThenReturnFile()
				}
			})
		}
	}

	const fetchUrlArticle: iRessourceApi['fetchUrlArticle'] = (url, cb, options) => {

		const readabilityUrl = `https://cdn.jsdelivr.net/npm/moz-readability@0.2.1/Readability.js`
		fetchRessource(readabilityUrl, readabilityTxt => {
			// nothing works except the eval
			const r1 = eval(readabilityTxt)

			fetchRessource(url, txt => {
				var doc = document.implementation.createHTMLDocument('');
				doc.open();
				doc.write(txt);
				doc.close();
				var article = new r1(doc).parse();
				//var article: any = {}

				let textContent = article?.textContent.replaceAll(`              `, `\n`) || ""
				textContent = textContent.replaceAll(`          `, `\n`)
				textContent = textContent.replaceAll(`      `, `\n`)
				textContent = textContent.replaceAll(`    `, `\n`)
				textContent = textContent.replaceAll(`   `, `\n`)

				let articleHtml = article?.content || ""
				let title = article?.title || ""

				cb({ title, text: textContent, html: articleHtml, raw: txt })
			})
		})
	}


	const ramFetchEvalCache = {val:{}}
	const fetchEval: iRessourceApi['fetchEval'] = (url, funcParams, options, cb) => {
		if (!options) options = {}
		if (!options.disableCache) options.disableCache = false
		if (options.disableCache === "true") options.disableCache = true
		console.log(h, "fetchEval", url, funcParams, options)

		// CODE EVAL
		const evalCode = (codeTxt:string) => {
			try {
				const paramsNames:string[] = []
				const paramsValues:any[] = []
				each(funcParams, (value, name) => {
					paramsNames.push(name)
					paramsValues.push(value)
				})
				let res = new Function(...paramsNames, codeTxt)(...paramsValues)
				cb && cb(res)
			} catch (e) {
				let message = `[ERR remote code] (api.ress.fetchEval): ${e} <br> url: ${url} (more infos in console)`
				console.log(message, e, {url, funcParams, options});
				notifLog(`${message}`)
			}
		}

		// GET CONTENT & FILE
		if (options.disableCache === true) ramFetchEvalCache.val[url] = null
		if (!ramFetchEvalCache.val[url] || options.disableCache === true) {
			fetchRessource(url, (codeTxt)=> {
				evalCode(codeTxt)
				ramFetchEvalCache.val[url] = codeTxt
			}, options)
		} else {
			evalCode(ramFetchEvalCache.val[url])
		}
	}

	const cleanCache = () => {
		ramFetchEvalCache.val = {}
		getApi(api => {
			api.folders.delete("cache", "fetch")
		})
	}

	const scanRessourceFolder: iRessourceApi['scanFolder'] = (folderPath, cb) => { 
		if (sharedConfig.client.log.socket) console.log(`[CLIENT API] get ressources files ${folderPath}`);
		const idReq = genIdReq('get-ressources-files-');
		// 1. add a listener function
		p.eventBus.subscribe(idReq, cb);
		// 2. emit request 
		clientSocket2.emit('askRessourceScan', {
			folderPath,
			token: getLoginToken(),
			idReq
		})
	}

	const compressImage: iRessourceApi['compressImage'] = (params, cb) => {
		const idReq = genIdReq('compress-image');
		console.log(`${h} compress image ${params.path}`);
		// execute callback on answer
		p.eventBus.subscribe(idReq, cb || (() => {}));
		clientSocket2.emit('askRessourceImageCompress', { params, idReq, token: getLoginToken() })
	}

	//
	// EXPORTS
	//
	const ressourceApi: iRessourceApi = {
		delete: deleteRessource,
		download: downloadRessource,
		compressImage,
		scanFolder: scanRessourceFolder, 
		fetch: fetchRessource,
		fetchEval,
		fetchUrlArticle,
		cleanCache,
	}

	return ressourceApi
}


// api.ressource.scanFolder("/demos", e => {console.log(222,e)})