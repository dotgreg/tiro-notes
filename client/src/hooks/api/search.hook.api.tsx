
import React, { useEffect, useRef, useState } from 'react';
import { iFile } from '../../../../shared/types.shared';
import { iBrowserApi } from './browser.api.hook';

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
	browserApi: iBrowserApi
}): iSearchApi => {
	const h = `[SEARCH API] 00563 `

	//
	// STATE
	//
	const [searchTerm, setSearchTerm] = useState('')

	//
	// FUNCTIONS
	// 
	const searchFiles: iSearchApi['files']['search'] = (term, cb) => {

	}

	const searchFilesAndUpdateUi: iSearchApi['ui']['search'] = (term) => {

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
			term: {
				set: setSearchTerm,
				get: searchTerm
			}
		},
	}
}
