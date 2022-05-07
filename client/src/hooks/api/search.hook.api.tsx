
import React, { useEffect, useRef, useState } from 'react';
import { iAppView, iFile } from '../../../../shared/types.shared';
import { clientSocket2 } from '../../managers/sockets/socket.manager';
import { getLoginToken } from '../app/loginToken.hook';
import { genIdReq, getClientApi2, iApiEventBus } from './api.hook';
import { iStatusApi } from './status.api.hook';

//
// INTERFACES
//
export interface iSearchApi {
	files: {
		search: (term: string, cb: (nFiles: iFile[]) => void) => void
	}
	ui: {
		search: (term: string) => void
		term: {
			set: (nTerm: string) => void
			get: string
		}
	}
}



export const useSearchApi = (p: {
	eventBus: iApiEventBus,
	statusApi: iStatusApi
}): iSearchApi => {
	const h = `[SEARCH API] 00563 `

	//
	// STATE
	//
	const [searchTerm, setSearchTerm] = useState('')

	//
	// FUNCTIONS
	// 
	const search = (term, cb, type: iAppView) => {
		const idReq = genIdReq(`search-${type}-`);
		console.log(`${h} searching ${term} with type ${type}`);
		p.statusApi.searching.set(true)

		// subscribe
		p.eventBus.subscribe(idReq, nFiles => {
			p.statusApi.searching.set(false)
			cb(nFiles)
		});

		// start request
		clientSocket2.emit('searchFor', {
			term,
			token: getLoginToken(),
			type,
			idReq
		})
	}

	const searchFiles: iSearchApi['files']['search'] = (term, cb) => {
		search(term, cb, 'text')
	}

	const searchFilesAndUpdateUi: iSearchApi['ui']['search'] = term => {
		getClientApi2().then(api => {
			api.ui.browser.files.set([])
			setSearchTerm(term)
			searchFiles(term, files => {
				api.ui.browser.files.set(files)
			})
		})
	}


	//
	// EXPORTS
	//
	return {
		files: {
			search: searchFiles
		},
		ui: {
			search: searchFilesAndUpdateUi,
			//status: { get: isSearching, set: setIsSearching },
			term: { set: setSearchTerm, get: searchTerm }
		},
	}
}
