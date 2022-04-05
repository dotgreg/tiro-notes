import '../../managers/scriptsInMarkdown.manager';
import { each, random } from 'lodash';
import React, { RefObject, useEffect, useRef, useState } from 'react';
import { regexs } from '../../../../shared/helpers/regexs.helper';
import { addCliCmd } from '../../managers/cliConsole.manager';
import { clientSocket2 } from '../../managers/sockets/socket.manager';
import { getLoginToken } from './loginToken.hook';
import { filterMetaFromFileContent } from '../../managers/headerMetas.manager';



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
			let filterRes = filterMetaFromFileContent(data.fileContent)
			onEventTriggerGoodListener(data.idReq, filterRes.content)
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
		const filePath = noteLinkToPath(noteLink);
		const idReq = genIdReq('get-file-content');
		// 1. add a listener function
		addListenerCallback(idReq, cb);
		// 2. emit request 
		clientSocket2.emit('askForFileContent', { filePath, token: getLoginToken(), idReq })
	}

	const clientApiSaveFileContent = (noteLink: string, content: string) => {
		const filePath = noteLinkToPath(noteLink);
		console.log(`[CLIENT API] try saving file content : ${filePath}, ${content}`);
		clientSocket2.emit('saveFileContent', { filePath, newFileContent: content, token: getLoginToken() })
	}



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





	// add/remove listener logic
	interface iListenersDic { [idReq: string]: Function }
	const listeners = useRef<iListenersDic>({})
	const addListenerCallback = (reqId: string, cb: Function) => {
		listeners.current[reqId] = cb
	}
	const onEventTriggerGoodListener = (reqIdAnswer: string, dataAnswer: any) => {
		each(listeners.current, (listenerCb, listenerReqId) => {
			if (listenerReqId === reqIdAnswer) {
				//console.log('onEventTriggerGoodListener', { listenerCb, reqIdAnswer, listenerReqId, dataAnswer });
				try {
					listenerCb(dataAnswer);
				} catch (e) {
					console.log('[CLIENT API] error with function', e);
				}
				delete listeners.current[listenerReqId];
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
${clientApiGetFileContent}`,
			func: clientApiGetFileContent,
			f: clientApiGetFileContent
		})






		addCliCmd('clientApiSaveFileContent', {

			description: `
Save a file content.
==
params
  noteLink: [link|myNoteLink]
  newFileContent 
==
${clientApiSaveFileContent}`,

			func: clientApiSaveFileContent,
			f: clientApiSaveFileContent
		})


		// add to window object


	};







	return {
	}
}


