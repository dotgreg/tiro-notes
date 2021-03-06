export { }

// import { cloneDeep, debounce, filter, sortBy } from 'lodash';
// import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
// import { iApiDictionary } from '../../../../shared/apiDictionary.type';
// import { iFile, iFilePreview, iTab } from '../../../../shared/types.shared';
// import { Icon } from '../../components/Icon.component';
// import { List, onFileDragStartFn } from '../../components/List.component';
// import { clientSocket2 } from '../../managers/sockets/socket.manager';
// import { sortFiles, SortModes, SortModesLabels } from '../../managers/sort.manager';
// import { cssVars } from '../../managers/style/vars.style.manager';
// import { useLocalStorage } from '../useLocalStorage.hook';
// import { useStatMemo } from '../useStatMemo.hook';
// import { getLoginToken } from './loginToken.hook';

// export type onFilesReceivedFn = (files: iFile[], temporaryResults: boolean, initialResults: boolean) => void
// export interface FilesPreviewObject { [path: string]: iFilePreview }

// export const useAppFilesList = (
// 	files: iFile[],
// 	setFiles: Function,
// 	activeFileIndex: number,
// 	setActiveFileIndex: Function,
// 	tabs: iTab[],
// 	onFilesReceivedCallback: onFilesReceivedFn
// ) => {

// 	const [sortMode, setSortMode] = useLocalStorage<number>('sortMode', 2)
// 	const [forceListUpdate, setForceListUpdate] = useState(1)











// 	//
// 	// FILES PREVIEWS
// 	//
// 	const [filesPreviewObj, setFilesPreviewObj] = useState<FilesPreviewObject>({})
// 	const listenerId = useRef<number>(0)
// 	useEffect(() => {
// 		listenerId2.current = clientSocket2.on('getFilesPreview', processFilesPreview)
// 		return () => {
// 			clientSocket2.off(listenerId2.current)
// 		}
// 	}, [filesPreviewObj])

// 	useEffect(() => {
// 		setFilesPreviewObj({})
// 	}, [files])
// 	const processFilesPreview = (data: iApiDictionary['getFilesPreview']) => {
// 		let newFilesPreviewObj: FilesPreviewObject = cloneDeep(filesPreviewObj)
// 		for (let i = 0; i < data.filesPreview.length; i++) {
// 			const filePreview = data.filesPreview[i];
// 			newFilesPreviewObj[filePreview.path] = filePreview
// 		}
// 		setFilesPreviewObj(newFilesPreviewObj)
// 	}
// 	const listenerId2 = useRef<number>(0)

// 	const askFilesPreview = (filesPath: string[]) => {
// 		// do not ask again if file already has been fetched
// 		let newFilesPathArr: string[] = []

// 		for (let i = 0; i < filesPath.length; i++) {
// 			const path = filesPath[i];
// 			if (!filesPreviewObj[path]) newFilesPathArr.push(path)
// 		}

// 		if (newFilesPathArr.length > 1) {
// 			console.log(`[LIST PREVIEW] askFilesPreview ${filesPath.length} asked but sent request for ${newFilesPathArr.length}`);
// 			clientSocket2.emit('askFilesPreview', { filesPath: newFilesPathArr, token: getLoginToken() })
// 		} else {
// 			console.log(`[LIST PREVIEW] no request sent`);
// 		}
// 	}












// 	//
// 	// receiving and processing files logic
// 	//
// 	// SOCKET INTERACTIONS
// 	useEffect(() => {
// 		console.log(`[FILES LIST] init socket listener`);
// 		listenerId.current = clientSocket2.on('getFiles', data => {
// 			onFolderFilesReceived(data)
// 		})
// 		return () => {
// 			console.log(`[FILES LIST] clean socket listener`);
// 			clientSocket2.off(listenerId.current)
// 		}
// 	}, [tabs])
// 	const askForFolderFiles = (folderPath: string) => {
// 		clientSocket2.emit('askForFiles', { folderPath: folderPath, token: getLoginToken(), idReq: `-` })
// 	}
// 	// DATA PROCESSING FUNCTIONS
// 	const filesRef = useRef<iFile[]>([])
// 	const onFolderFilesReceived = (data: iApiDictionary['getFiles']) => {

// 		if (data.initialResults) {
// 			filesRef.current = []
// 		}
// 		else if (data.temporaryResults) {
// 			filesRef.current = [...filesRef.current, ...data.files]
// 		} else {
// 			filesRef.current = cloneDeep(data.files)
// 		}
// 		// sort them
// 		// console.log(`[SORT] sorting received files with sort mode ${sortMode} : ${SortModes[sortMode]}`);
// 		filesRef.current = sortFiles(filesRef.current, sortMode)
// 		setFiles(filesRef.current)
// 		onFilesReceivedCallback(
// 			filesRef.current,
// 			data.temporaryResults || false,
// 			data.initialResults || false
// 		)
// 	}


// 	const FilesListComponent = (p: {
// 		searchTerm: string,
// 		selectedFolder: string,
// 		onFileClicked: (fileIndex: number) => void
// 		onFileDragStart: onFileDragStartFn
// 		onFileDragEnd: () => void
// 	}) => useStatMemo(
// 		<div className="files-list-component">
// 			<div className='list-toolbar'>
// 				<button
// 					type="button"
// 					title='sort'
// 					onClick={e => {
// 						let newMode = sortMode + 1 >= SortModes.length ? 0 : sortMode + 1
// 						setSortMode(newMode)
// 						setFiles(sortFiles(files, newMode))
// 					}}
// 				>
// 					<span> {files.length > 0 && <span className='list-count'>({files.length})</span>} {SortModesLabels[sortMode]} </span>
// 					<Icon name="faSort" color={cssVars.colors.l2.text} />
// 				</button>
// 			</div>



// 			{
// 				/////////////////////////////
// 				// LIST
// 				/////////////////////////////
// 			}
// 			<div
// 				className="list-wrapper"
// 			// onScroll={(e) => {
// 			//     console.log('scrollOnList', );

// 			// }}
// 			>
// 				<List
// 					files={files}
// 					filesPreview={filesPreviewObj}

// 					hoverMode={false}
// 					activeFileIndex={activeFileIndex}

// 					sortMode={sortMode}

// 					onFileClicked={(fileIndex) => {
// 						setActiveFileIndex(fileIndex)
// 						p.onFileClicked(fileIndex)
// 					}}

// 					onFileDragStart={p.onFileDragStart}
// 					onFileDragEnd={p.onFileDragEnd}

// 					onVisibleItemsChange={visibleFilesPath => {
// 						askFilesPreview(visibleFilesPath)
// 					}}
// 				/>
// 			</div>
// 		</div>
// 		, [files, tabs, activeFileIndex, sortMode, forceListUpdate, filesPreviewObj])

// 	return {
// 		activeFileIndex, setActiveFileIndex,
// 		files, setFiles,
// 		askForFolderFiles,
// 		FilesListComponent,
// 	}
// } 
