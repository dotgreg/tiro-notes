import '../../managers/scriptsInMarkdown.manager';
import { each, random } from 'lodash';
import React, { RefObject, useContext, useEffect, useRef, useState } from 'react';
import { regexs } from '../../../../shared/helpers/regexs.helper';
import { addCliCmd } from '../../managers/cliConsole.manager';
import { clientSocket2, ClientSocketManager } from '../../managers/sockets/socket.manager';
import { getLoginToken } from './loginToken.hook';
import { filterMetaFromFileContent } from '../../managers/headerMetas.manager';
import { iApiDictionary } from '../../../../shared/apiDictionary.type';


//
// FUNCTION TO UDE 
//
export const getClientApi = (): Promise<iClientApi2> => {
	return new Promise((res, rej) => {
		if (clientApiInt) return res(clientApiInt)
		else {
				let intId = setInterval(() => {
						if (clientApiInt) {
								return res(clientApiInt)

						}
				}, 200)

		}
	})
}


//
// INIT LOGIC
//
export const initClientApi = (clientSocket2: ClientSocketManager<iApiDictionary>) => {
	console.log(`[CLIENT API] INIT CLIENT DONE`);

	// LISTEN TO SOCKET 
	listenerId[0] = clientSocket2.on('getFileContent', data => {
		let filterRes = filterMetaFromFileContent(data.fileContent)
		onEventTriggerGoodListener(data.idReq, filterRes.content)
	})

	// COMPLETE ClientApiInt
	clientApiInt = {
		getFileContent: apiGetFileContent,
		saveFileContent: apiSaveFileContent
	}

}

//
// API FUNCTIONS
//
const apiGetFileContent: iClientApi2['getFileContent'] = (noteLink, cb) => {
	const filePath = noteLinkToPath(noteLink);
	const idReq = genIdReq('get-file-content');
	// 1. add a listener function
	addListenerCallback(idReq, cb);
	// 2. emit request 
	clientSocket2.emit('askForFileContent', { filePath, token: getLoginToken(), idReq })
}

const apiSaveFileContent: iClientApi2['saveFileContent'] = (noteLink: string, content: string) => {
	const filePath = noteLinkToPath(noteLink);
	//console.log(`[CLIENT API] try saving file content : ${filePath}, ${content}`);
	clientSocket2.emit('saveFileContent', { filePath, newFileContent: content, token: getLoginToken() })
}


//
// INTERFACES
//

export interface iClientApi2 {
	getFileContent: (noteLink: string, cb: Function) => void
	saveFileContent: (noteLink: string, content: string) => void
}


//
// STORAGE
//

let clientApiInt: iClientApi2 | null = null
const listenerId: any[] = []

//
// EVENT BUS MANAGEMENT
//
interface iListenersDic { [idReq: string]: Function }
const listeners: iListenersDic = {}
const addListenerCallback = (reqId: string, cb: Function) => {
	listeners[reqId] = cb
}
const onEventTriggerGoodListener = (reqIdAnswer: string, dataAnswer: any) => {
	each(listeners, (listenerCb, listenerReqId) => {
		if (listenerReqId === reqIdAnswer) {
			try {
				listenerCb(dataAnswer);
			} catch (e) {
				console.log('[CLIENT API] error with function', e);
			}
			delete listeners[listenerReqId];
		}
	});
}



	// add to window object
	const addCliCmds = () => {

		addCliCmd('clientApiGetFileContent', {
			description: `
Get a file content.
Return null if path invalid
==
params
  noteLink: [link|myNoteLink]
  callback: Function (noteContent) {}
==
${apiGetFileContent}`,
			func: apiGetFileContent,
			f: apiGetFileContent
		})

		addCliCmd('clientApiSaveFileContent', {

			description: `
Save a file content.
==
params
  noteLink: [link|myNoteLink]
  newFileContent 
==
${apiSaveFileContent}`,

			func: apiSaveFileContent,
			f: apiSaveFileContent
		})
	};

//
// SUPPORT FUNCTIONS
//
const genIdReq = (type: string): string => {
	return `client-api-${type}-req-${random(1, 10000000)}`;
}

const noteLinkToPath = (noteLink: string): string => {
	const subst = `$2/$1`;
	return noteLink.replace(regexs.linklink, subst);
}




