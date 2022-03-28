import { each, random } from 'lodash';
import React, { RefObject, useEffect, useRef, useState } from 'react';
import { regexs } from '../../../../shared/helpers/regexs.helper';
import { addCliCmd } from '../../managers/cliConsole.manager';
import { clientSocket2 } from '../../managers/sockets/socket.manager';
import { getLoginToken } from './loginToken.hook';

export const useClientApi = (
) => {

	// STATE

	// SOCKET INTERACTIONS
	const listenerId1 = useRef<number>(0)

	useEffect(() => {
		// 
		// INIT STEP
		// 

		// ADDING CLI CMDs to WINDOW
		addCliCmds();

		// GET FILE CONTENT
		console.log(`[CLIENT API] GetFileContent:  init socket listener`);
		listenerId1.current = clientSocket2.on('getFileContent', data => {
			onEventTriggerGoodListener(data.idReq, data)
		})

		return () => {
			//
			// CLEANING STEP
			//

			// GET FILE CONTENT
			console.log(`[CLIENT API] GetFileContent: clean socket listener`);
			clientSocket2.off(listenerId1.current)
		}
	}, [])




	//
	// API FUNCTIONS
	//
	const clientApiGetFileContent = (noteLink: string, cb: Function) => {
		// noteLink > notePath
		console.log(1212, noteLinkToPath(noteLink));
		const filePath = noteLinkToPath(noteLink);

		// generate unique reqId
		const idReq = `client-api-get-file-content-req-${random(1, 10000000)}`
		// add a listener function
		addListenerCallback(idReq, cb);

		// emit request 
		clientSocket2.emit('askForFileContent', { filePath, token: getLoginToken(), idReq })

	}




	//
	// SUPPORT FUNCTIONS
	//
	const noteLinkToPath = (noteLink: string): string => {
		const subst = `$2$1`;
		return noteLink.replace(regexs.linklink, subst);
	}

	// add to window object
	const addCliCmds = () => {
		addCliCmd('clientApiGetFileContent', {
			description: 'ask for a file content. params => (noteLink: [link|myNoteLink], callback: (NoteContent) => {} )',
			func: clientApiGetFileContent
		})
	};

	// add/remove listener logic
	interface iListenersDic { [idReq: string]: Function }
	const listeners = useRef<iListenersDic>({})
	const addListenerCallback = (reqId: string, cb: Function) => {
		listeners.current[reqId] = cb
	}
	const onEventTriggerGoodListener = (reqIdAnswer: string, dataAnswer: any) => {
		each(listeners.current, (listenerCb, listenerReqId) => {
			if (listenerReqId === reqIdAnswer) {
				listenerCb(dataAnswer);
				delete listeners.current[listenerReqId];
			}
		});
	}


	return {
	}
}


