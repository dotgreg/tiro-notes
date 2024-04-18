import { cloneDeep } from 'lodash-es';
import React, { RefObject, useEffect, useRef, useState } from 'react';
import { iFile, iFileMetas } from '../../../../shared/types.shared';
import { toTimeStampInS } from '../../../../shared/helpers/timestamp.helper';
import { filterMetaFromFileContent } from '../../managers/headerMetas.manager';
import { clientSocket2 } from '../../managers/sockets/socket.manager';
import { getLoginToken } from './loginToken.hook';
import { onLightboxClickFn } from '../../components/dualView/EditorArea.component';
import { getApi } from '../api/api.hook';

export const useFileContent = (
	activeFile: iFile | null,
	activeFileIndex: number,
	selectedFolder: string,
	files: iFile[],
	shouldLoadNoteIndex: any,
	cleanFileDetails: Function,
	askForMoveFile: Function,
) => {

	// STATE
	const [fileContent, setFileContent] = useState<string | null>(null)
	const [fileMetas, setFileMetas] = useState<iFileMetas>({})
	const [canEdit, setCanEdit] = useState(false)

	const idReq = 'currentlyDisplayedNote';
	// SOCKET INTERACTIONS
	const listenerId = useRef<number>(0)

	useEffect(() => {
		console.log(`[FILE CONTENT] init socket listener`);
		listenerId.current = clientSocket2.on('getFileContent', data => {

			// only takes in account right idReq 
			if (data.idReq !== idReq) return;

			console.log('[FILE CONTENT] getFileContent', data)
			setCanEdit(true)

			// remove metas from content
			let filterRes = filterMetaFromFileContent(data.fileContent)
			// console.log(JSON.stringify({filterRes}), metasObjToString(filterRes.metas))
			setFileMetas(filterRes.metas)

			setFileContent(filterRes.content)
		}
		)
		return () => {
			console.log(`[FILE CONTENT] clean socket listener`);
			clientSocket2.off(listenerId.current)
		}
	}, [])

	// const onFileEditedSaveIt = (filepath, content) => {


	// 	// META MANAGEMENT
	// 	// before saving, reconstitute metas into content
	// 	const nFileMeta = cloneDeep(fileMetas)
	// 	// all of that complex system for that line to work...
	// 	if (!nFileMeta.created) nFileMeta.created = toTimeStampInS(activeFile && activeFile.created ? activeFile.created : Date.now())
	// 	// update the modified field everytime it is edited
	// 	nFileMeta.modified = toTimeStampInS(Date.now())
	// 	const contentWithMeta = `${metasObjToHeaderString(nFileMeta)}${content}`



	// 	// SAVING MECHANISME
	// 	console.log(`[FILE CONTENT] API -> ask for file save`, { filepath, contentWithMeta });
	// 	// clientSocket2.emit('saveFileContent', {
	// 	// 	filePath: filepath,
	// 	// 	newFileContent: contentWithMeta,
	// 	// 	token: getLoginToken()
	// 	// })
	// 	getApi(api => {
	// 		api.file.saveContent(filepath, contentWithMeta)
	// 	})
	// }

	const askForFileContent = (file: iFile) => {
		if (file && file.name.endsWith('.md')) {
			setFileContent('loading...')
			setCanEdit(false)

			clientSocket2.emit('askForFileContent', { filePath: file.path, token: getLoginToken(), idReq })
		}
	}


	// COMPONENT RENDERING
	const DualViewerComponent = (p: {
		isLeavingNote: boolean
		onBackButton: Function
		onToggleSidebarButton: Function
		onLightboxClick: onLightboxClickFn
		forceRender: boolean
	}) =>
		<></>


	return {
		setFileContent, fileContent,
		setCanEdit,
		askForFileContent,
		DualViewerComponent
	}
}



