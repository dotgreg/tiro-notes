import React, { useEffect, useRef } from 'react';
import { getRessourceIdFromUrl } from '../../../../shared/helpers/id.helper';
import { sharedConfig } from '../../../../shared/shared.config';
import { clientSocket2, getBackendUrl } from '../../managers/sockets/socket.manager';
import { getLoginToken } from '../app/loginToken.hook';
import { genIdReq, iApiEventBus } from './api.hook';
import { checkUrlExists } from '../../managers/url.manager'

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
		cb: (urlContent: string) => void,
		options?: { disableCache?: boolean }
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
		console.log(`${h} downloading ressource url ${url} to folder ${folder}`);
		// execute callback on answer
		p.eventBus.subscribe(idReq, cb);
		clientSocket2.emit('askRessourceDownload', { url, folder, idReq, token: getLoginToken() })
	}


	const fetchRessource: iRessourceApi['fetch'] = (url, cb, options) => {
		console.log(`${h} FETCHING ressource url ${url} `, { url, options });
		if (!options) options = {}
		if (!options.disableCache) options.disableCache = false

		const folder = `/.tiro/cache/fetch/`
		const staticPath = `${getBackendUrl()}/${sharedConfig.path.staticResources}/${folder}${getRessourceIdFromUrl(url)}?token=${getLoginToken()}`

		const returnFile = () => {
			fetch(staticPath).then(function (response) {
				return response.text();
			}).then(function (data) {
				cb(data)
			})
		}
		const downloadThenReturnFile = () => {
			downloadRessource(url, folder, answer => {
				if (answer.message) { returnFile() }
			})
		}

		if (options.disableCache === true) {
			downloadThenReturnFile()
		}
		else {
			checkUrlExists({
				url: staticPath,
				onSuccess: () => {
					console.log(`${h} FETCHING => getting CACHED file`, { url, options });
					returnFile()
				},
				onFail: () => { downloadThenReturnFile() }
			})
		}
	}



	//
	// EXPORTS
	//
	const ressourceApi: iRessourceApi = {
		delete: deleteRessource,
		download: downloadRessource,
		fetch: fetchRessource
	}

	return ressourceApi
}
