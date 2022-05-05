import React, { useEffect, useRef } from 'react';
import { clientSocket2 } from '../../managers/sockets/socket.manager';
import { getLoginToken } from '../app/loginToken.hook';

//
// INTERFACES
//
export interface iNoteHistoryApi {
	save: (filePath: string, content: string, type: 'int' | 'enter') => void
	intervalSave: (filePath: string, content: string) => void
}


export const useNoteHistoryApi = (p: {}):iNoteHistoryApi => {
	const h = `[NOTE HISTORY] 0047 `

	// 5. ON SAVE, AUTOMATIC HISTORY CALL EVERY 10m OR WHEN FILE CHANGE
	interface iNotesLastHistory {
		[notepath: string]: number
	}
	const notesLastHistory = useRef<iNotesLastHistory>({})
	const getNow = () => new Date().getTime()
	let histDelayInMin = 1
	let histDelayInMs = histDelayInMin * 60 * 1000

	const saveNoteHistory: iNoteHistoryApi['save'] = (filePath, content, type) => {
		console.log(`${h} saveNoteHistory ${filePath}`);
		clientSocket2.emit('createHistoryFile', {
			filePath,
			content,
			historyFileType: '',
			token: getLoginToken()
		})
	}

	const saveIntervalNoteHistory = (filepath: string, content: string) => {
		const fileLastHistory = notesLastHistory.current[filepath]

		if (
			!fileLastHistory ||
			(fileLastHistory && fileLastHistory + histDelayInMs < getNow())
		) {
			console.log(`${h} ${filepath}, time ${histDelayInMin} expired/inexistand, PROCEED BACKUP`);
			saveNoteHistory(filepath, content, 'int')
			notesLastHistory.current[filepath] = getNow()
		}
	}

	return {
		save: saveNoteHistory,
		intervalSave: saveIntervalNoteHistory
	}


}
