import React, { useEffect, useState } from 'react';
import { clientSocket2 } from '../../managers/sockets/socket.manager';
import { iApiEventBus } from './api.hook';


//
// INTERFACES
//
type iWatchUpdate = { filePath: string, fileContent: string }
export interface iWatchApi {
	/**
	 * Watch for file changes
	 */
	file: (
		notePath: string,
		cb: (res: iWatchUpdate) => void,
	) => void

	/**
	 * Watch for app status change
	 */
	appStatus: (
		cb: (p: { isConnected: boolean }) => void
	) => void
	dev: {
		toggleIsConnected: (status:boolean) => void
	}
}

// let watchCounter
export const useWatchApi = (p: {
	eventBus: iApiEventBus
}) => {
	const h = `[WATCH API]`



	//
	// 
	// 
	useEffect(() => {
		clientSocket2.on('reconnect', () => {
			p.eventBus.notify(uniqueIdReq, { isConnected: true })
		})
		clientSocket2.on('reconnect', () => {
			p.eventBus.notify(uniqueIdReq, { isConnected: true })
		})
		clientSocket2.on('disconnect', () => {
			p.eventBus.notify(uniqueIdReq, { isConnected: false })
		})
	}, [])

	const toggleIsConnected = (status) => {
		p.eventBus.notify(uniqueIdReq, { isConnected: status })
	}


	const watchStatusIdReq = `watch-status-api-unique-id-request`
	const watchStatus: iWatchApi['appStatus'] = (cb) => {
		p.eventBus.subscribe(uniqueIdReq, answer => {
			cb(answer)
		}, { persistent: true });
	}









	const uniqueIdReq = `watch-api-unique-id-request`

	//
	// LISTEN TO SOCKET
	// 
	useEffect(() => {
		clientSocket2.on('onNoteWatchUpdate', data => {
			p.eventBus.notify(uniqueIdReq, data)
		})
	}, [])

	//
	// FUNCTIONS
	// 

	// 1. GET CONTENT
	const watchFile: iWatchApi['file'] = (noteLink, cb) => {
		// 1. add a PERSISTENT listener function
		p.eventBus.subscribe(uniqueIdReq, answer => {
			if (noteLink === answer.filePath) {
				cb(answer)
			}
		}, { persistent: true });
	}

	//
	// EXPORTS
	//
	const watchApi: iWatchApi = {
		file: watchFile,
		appStatus: watchStatus,
		dev: {
			toggleIsConnected
		}
	}

	return watchApi
}

