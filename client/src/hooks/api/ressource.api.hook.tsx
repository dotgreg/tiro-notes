import React, { useEffect, useRef } from 'react';
import { getRessourceIdFromUrl } from '../../../../shared/helpers/id.helper';
import { sharedConfig } from '../../../../shared/shared.config';
import { clientSocket2, getBackendUrl } from '../../managers/sockets/socket.manager';
import { getLoginToken } from '../app/loginToken.hook';
import { genIdReq, iApiEventBus } from './api.hook';
import { checkUrlExists } from '../../managers/url.manager'
import { each, random } from 'lodash';
import { cleanPath } from '../../../../shared/helpers/filename.helper';
import {  getStaticRessourceLink } from '../../managers/ressource.manager';
import { notifLog } from '../../managers/devCli.manager';

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
		cb: (answer: any) => void
	) => void,

	fetch: (
		url: string,
		cb: (urlContent: string, urlPath:string) => void,
		options?: { 
			disableCache?: boolean 
			returnsPathOnly?:boolean
		}
	) => void,
	
	fetchEval: (
		url: string,
		params?: iEvalFuncParams,
		options?: { 
			disableCache?: boolean 
		}
	) => void,

	fetchUrlArticle: (
		url: string,
		cb: (out: { title: string, text: string, html: string, raw: string }) => void,
		options?: {}
	) => void
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

	const downloadRessource: iRessourceApi['download'] = (url, folder, cb) => {
		const idReq = genIdReq('download-ressource');
		// console.log(`${h} downloading ressource url ${url} to folder ${folder}`);
		// execute callback on answer
		p.eventBus.subscribe(idReq, cb);
		clientSocket2.emit('askRessourceDownload', { url, folder, idReq, token: getLoginToken() })
	}


	const fetchRessource: iRessourceApi['fetch'] = (url, cb, options) => {

		if (!options) options = {}
		if (!options.disableCache) options.disableCache = false
		if (!options.returnsPathOnly) options.returnsPathOnly = false

		const folder = `/.tiro/cache/fetch/`
		let localStaticPath = getStaticRessourceLink(`/${folder}${getRessourceIdFromUrl(url)}`)
		// localStaticPath = cleanPath(`${getBackendUrl()}${localStaticPath}`)

		console.log(`${h} FETCHING ressource url ${url} `, { url, options, localStaticPath });

		const returnFile = () => {
			fetch(localStaticPath).then(function (response) {
				return response.text();
			}).then(function (data) {
				try {
					cb(data, localStaticPath)
				} catch (error) {
					notifLog(`${error}`)
				}
			})
		}
		const returnFilePath = () => { cb("", localStaticPath) }

		const downloadThenReturnFile = () => {
			downloadRessource(url, folder, answer => {
				if (answer.message) { 
					if (!options?.returnsPathOnly) returnFile() 
					else returnFilePath()
				}
			})
		}

		if (options.disableCache === true) {
			downloadThenReturnFile()
		}
		else {
			checkUrlExists({
				url: localStaticPath,
				onSuccess: () => {
					console.log(`${h} FETCHING => getting CACHED file`, { url, options });
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


	const ramFetchEvalCache = {}
	const fetchEval: iRessourceApi['fetchEval'] = (url, funcParams, options) => {
		if (!options) options = {}
		if (!options.disableCache) options.disableCache = false
		const evalCode = (codeTxt:string) => {
			try {
				const paramsNames:string[] = []
				const paramsValues:any[] = []
				each(funcParams, (value, name) => {
					paramsNames.push(name)
					paramsValues.push(value)
				})
				new Function(...paramsNames, codeTxt)(...paramsValues)
			} catch (e) {
				let message = `[ERROR LOADING REMOTE CODE]: ${JSON.stringify(e)}"`
				console.log(message);
				notifLog(`${message}`)
			}
		}
		if (!ramFetchEvalCache[url] || options.disableCache) {
			fetchRessource(url, (codeTxt)=> {
				evalCode(codeTxt)
				ramFetchEvalCache[url] = codeTxt
			}, options)
		} else {
			evalCode(ramFetchEvalCache[url])
		}
	}


	//
	// EXPORTS
	//
	const ressourceApi: iRessourceApi = {
		delete: deleteRessource,
		download: downloadRessource,
		fetch: fetchRessource,
		fetchEval,
		fetchUrlArticle,
	}

	return ressourceApi
}
