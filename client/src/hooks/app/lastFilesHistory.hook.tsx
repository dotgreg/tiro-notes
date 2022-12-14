import React, { useEffect } from 'react';
import { sharedConfig } from '../../../../shared/shared.config';
import { iFile } from "../../../../shared/types.shared"
import { useDebounce } from '../lodash.hooks';
import { useBackendState } from '../useBackendState.hook';

const h = `[LAST FILE]`
const log = sharedConfig.client.log.verbose

export const useLastFilesHistory = (activeFile: iFile) => {
	const [filesHistory, setFilesHistory, refreshFilesHistoryFromBackend] = useBackendState<iFile[]>('files-history', [])

	useEffect(() => {
		log && console.log(h, ' activeFile changed!', activeFile);
		activeFile && addToHistory(activeFile)
	}, [activeFile])

	const cleanLastFilesHistory = () => {
		setFilesHistory([])
	}

	const addToHistory = (file: iFile) => {
		log && console.log(h, 'Add to history', file.name);

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
		newfilesHistory = newfilesHistory.slice(0, 200)
		newfilesHistory.unshift(file)
		setFilesHistory(newfilesHistory)
		console.log("FILES HISTORY", { newfilesHistory });
	}
	const debouncedAddToHistory = useDebounce(addToHistory, 1000)

	return { filesHistory, cleanLastFilesHistory, refreshFilesHistoryFromBackend }
}

