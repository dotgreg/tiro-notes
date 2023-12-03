
import React, { useEffect, useRef, useState } from 'react';
import { iAppView, iFile, iSearchWordRes } from '../../../../shared/types.shared';
import { getHashtags, iHashtags } from '../../managers/hashtags.manager';
import { clientSocket2 } from '../../managers/sockets/socket.manager';
import { getLoginToken } from '../app/loginToken.hook';
import { genIdReq, getClientApi2, iApiEventBus } from './api.hook';
import { iStatusApi } from './status.api.hook';

//
// INTERFACES
//

// MAIN
export interface iSearchApi {
	files: iSearchFilesApi
	word: (word: string, folder: string, cb: (res: iSearchWordRes) => void) => void
	hashtags: (folder: string, cb: (res: iHashtags) => void) => void
	ui: iSearchUiApi
}

// SUB
export interface iSearchFilesApi {
	search: (term: string, cb: (
		nFiles: iFile[],
		contentSearchPreview?: string[]
	) => void) => void
}
export interface iSearchUiApi {
	search: (term: string) => void
	term: {
		set: (nTerm: string) => void
		get: string
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
	// LISTEN TO SOCKET
	// 
	useEffect(() => {
		clientSocket2.on('getWordSearch', data => {
			p.eventBus.notify(data.idReq, data.result)
		})
	}, [])

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

	const searchWord: iSearchApi['word'] = (word, folder, cb) => {
		const idReq = genIdReq(`search-word-`);
		// replace all special chars like + or * by \\char
		word = word.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
		console.log(`${h} searching WORD ${word}`);

		// subscribe
		p.eventBus.subscribe(idReq, (res: iSearchWordRes) => { cb(res) });

		// start request
		clientSocket2.emit('searchWord', { word, folder, token: getLoginToken(), idReq })
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


	const searchHashtags: iSearchApi['hashtags'] = (folder, cb) => {
		getHashtags(folder).then(res => {
			cb(res)
		})
	}



	//
	// EXPORTS
	//
	return {
		files: {
			search: searchFiles
		},
		word: searchWord,
		hashtags: searchHashtags,
		ui: {
			search: searchFilesAndUpdateUi,
			//status: { get: isSearching, set: setIsSearching },
			term: { set: setSearchTerm, get: searchTerm }
		},
	}
}
