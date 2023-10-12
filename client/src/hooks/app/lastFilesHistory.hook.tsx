import { cloneDeep } from 'lodash';
import React, { useEffect } from 'react';
import { sharedConfig } from '../../../../shared/shared.config';
import { iFile } from "../../../../shared/types.shared"
import { useDebounce } from '../lodash.hooks';
import { useBackendState } from '../useBackendState.hook';

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





export const useLastFilesHistory = (activeFile: iFile) => {
	const [filesHistory, setFilesHistory, refreshFilesHistoryFromBackend] = useBackendState<iFile[]>('files-history', [])

	useEffect(() => {
		log && console.log(h, ' activeFile changed!', activeFile);
		activeFile && addToHistoryInt(activeFile)
	}, [activeFile])

	const cleanLastFilesHistory = () => {
		setFilesHistory([])
	}

	const addToHistoryInt = (file: iFile) => {
		log && console.log(h, 'Add to history', file.name);

		// if already at first position in hist, do nothing
		if (filesHistory.length > 0 && filesHistory[0].name === file.name) return

		let shouldAddToHistory = true
		let indexOldPos = -1
		let newfilesHistory = filesHistory
		for (let i = 0; i < filesHistory.length; i++) {
			if (filesHistory[i].name === file.name) {
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
	

	return { filesHistory, cleanLastFilesHistory, refreshFilesHistoryFromBackend, lastFilesHistoryApi }
}

