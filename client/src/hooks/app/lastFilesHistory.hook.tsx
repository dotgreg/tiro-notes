import { cloneDeep, isArray } from 'lodash-es';
import React, { useEffect } from 'react';
import { sharedConfig } from '../../../../shared/shared.config';
import { iFile } from "../../../../shared/types.shared"
import { useDebounce } from '../lodash.hooks';
import { useBackendState } from '../useBackendState.hook';
import { isA } from '../../managers/device.manager';

const h = `[LAST FILE]`
const log = sharedConfig.client.log.verbose

//
// API
//
export interface iLastFilesHistoryApi {
	getAll: () => iFile[]
	removeFile: (filePath:string) => void
	addToHistory: (file:iFile, debounced?:boolean) => void
}

const blacklistPaths = ['.tiro/answers/']
const isBlacklisted = (path:string) => {
	for (const blackPath of blacklistPaths) {
		if (path.includes(blackPath)) return true
	}
	return false
}



export const useLastFilesHistory = (activeFile: iFile) => {
	const [filesHistory, setFilesHistory, refreshFilesHistoryFromBackend] = useBackendState<iFile[]>('files-history', [], {history: false, debouncedSave: 5000})
	const filesHistoryRef = React.useRef(filesHistory)
	useEffect(() => {
		filesHistoryRef.current = filesHistory
	}, [filesHistory])

	useEffect(() => {
		log && console.log(h, ' activeFile changed!', activeFile);
		activeFile && addToHistoryInt(activeFile)
	}, [activeFile])

	const cleanLastFilesHistory = () => {
		setFilesHistory([])
	}

	const addToHistoryInt = (file: iFile) => {
		// if (isBlacklisted(file.path)) return

		log && console.log(h, 'Add to history', file.name);
		const nfilesHist = filesHistoryRef.current

		// if already at first position in hist, do nothing
		if (nfilesHist.length > 0 && nfilesHist[0].name === file.name) return

		let shouldAddToHistory = true
		let indexOldPos = -1
		let newfilesHistory = nfilesHist
		if (isArray(nfilesHist) === false) newfilesHistory = []
		for (let i = 0; i < nfilesHist.length; i++) {
			if (nfilesHist[i].name === file.name) {
				// already in array
				shouldAddToHistory = false
				indexOldPos = i
			}
		}

		if (!shouldAddToHistory) newfilesHistory.splice(indexOldPos, 1)

		// only keep x notes
		newfilesHistory = newfilesHistory.slice(0, 400)
		newfilesHistory.unshift(file)
		setFilesHistory(newfilesHistory)
		
	}
	const debouncedAddToHistory = useDebounce(addToHistoryInt, 300)

	const addToHistory = (file: iFile, debounced:boolean = true) => {
		
		debounced ? debouncedAddToHistory(file) : addToHistoryInt(file)
	}


	
	//
	// API
	//
	const getAll = () => {
		return filesHistory
	}
	const removeFile = (filePath:string) => {
		console.log(`${h} removing ${filePath} from last notes`)
		let nfiles = cloneDeep(filesHistory)
		nfiles = nfiles.filter(it => it.path !== filePath)
		setFilesHistory(nfiles)
	}
	
	const lastFilesHistoryApi:iLastFilesHistoryApi = {
		getAll,
		removeFile,
		addToHistory,
	}
	

	return { filesHistory, filesHistoryRef, cleanLastFilesHistory, refreshFilesHistoryFromBackend, lastFilesHistoryApi }
}

