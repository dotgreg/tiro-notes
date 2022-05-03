import { cloneDeep } from 'lodash';
import React, { RefObject, useEffect, useRef, useState } from 'react';
import { iFile, iFileMetas } from '../../../../shared/types.shared';
import { toTimeStampInS } from '../../../../shared/helpers/timestamp.helper';
import { DualViewer } from '../../components/dualView/DualViewer.component';
import { filterMetaFromFileContent, metasObjToHeaderString } from '../../managers/headerMetas.manager';
import { clientSocket2 } from '../../managers/sockets/socket.manager';
import { useStatMemo } from '../useStatMemo.hook';
import { getLoginToken } from './loginToken.hook';
import { onLightboxClickFn } from '../../components/dualView/EditorArea.component';

export const useFileContent = (
	activeFile: iFile | null,
	activeFileIndex: number,
	selectedFolder: string,
	files: iFile[],
	shouldLoadNoteIndex: any,

	cleanFileDetails: Function,
	askForMoveFile: Function,
	askForFolderFiles: Function,
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

	const onFileEditedSaveIt = (filepath, content) => {


		// META MANAGEMENT
		// before saving, reconstitute metas into content
		const nFileMeta = cloneDeep(fileMetas)
		// all of that complex system for that line to work...
		if (!nFileMeta.created) nFileMeta.created = toTimeStampInS(activeFile && activeFile.created ? activeFile.created : Date.now())
		// update the modified field everytime it is edited
		nFileMeta.modified = toTimeStampInS(Date.now())
		const contentWithMeta = `${metasObjToHeaderString(nFileMeta)}${content}`



		// SAVING MECHANISME
		console.log(`[FILE CONTENT] API -> ask for file save`, { filepath, contentWithMeta });
		clientSocket2.emit('saveFileContent', {
			filePath: filepath,
			newFileContent: contentWithMeta,
			token: getLoginToken()
		})
	}

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

		// useStatMemo(
		// 	<div className="note-wrapper">
		// 		{
		// 			(activeFile) &&
		// 			<DualViewer
		// 				file={activeFile}
		// 				canEdit={canEdit}
		// 				isLeavingNote={p.isLeavingNote}
		// 				// viewType={p.viewType}
		// 				fileContent={fileContent ? fileContent : ''}
		// 				onFileEdited={onFileEditedSaveIt}
		// 				onFileTitleEdited={(initTitle, endTitle) => {
		// 					let initPath = `${activeFile.folder}/${initTitle}.md`
		// 					let endPath = `${activeFile.folder}/${endTitle}.md`
		// 					console.log(`[FILE CONTENT] onFileTitleEdited =>`, { initPath, endPath });
		// 					askForMoveFile(initPath, endPath)
		// 					shouldLoadNoteIndex.current = 0
		// 				}}
		// 				onSavingHistoryFile={(filePath, content, historyFileType) => {
		// 					console.log(`[FILE CONTENT] onSavingHistoryFile ${historyFileType} => ${filePath}`);
		// 					clientSocket2.emit('createHistoryFile', { filePath, content, historyFileType, token: getLoginToken() })
		// 				}}
		// 				onFileDelete={(filepath) => {
		// 					console.log(`[FILE CONTENT] onFileDelete => ${filepath}`);
		// 					let i = activeFileIndex
		// 					if (i > 0) shouldLoadNoteIndex.current = i - 1
		// 					else if (i === 0 && files.length > 0) shouldLoadNoteIndex.current = 0
		// 					// else if (i < files.length - 2) shouldLoadNoteIndex.current = i+1
		// 					else cleanFileDetails()
		// 					clientSocket2.emit('onFileDelete', { filepath, token: getLoginToken() })
		// 					askForFolderFiles(selectedFolder)
		// 				}}
		// 				onLightboxClick={p.onLightboxClick}
		// 				onBackButton={p.onBackButton}
		// 				onToggleSidebarButton={p.onToggleSidebarButton}
		// 			/>
		// 		}
		// 		{
		// 			!activeFile &&
		// 			<div className='no-file'>No file</div>
		// 		}
		// 	</div>
		// 		, [fileContent, activeFile, canEdit, p.isLeavingNote, p.forceRender, p.onToggleSidebarButton]


return {
	setFileContent, fileContent,
	setCanEdit,
	askForFileContent,
	DualViewerComponent
}
}



