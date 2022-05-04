import styled from '@emotion/styled';
import { cloneDeep, each } from 'lodash';
import { title } from 'process';
import React, { useContext, useEffect, useReducer, useRef, useState } from 'react';
import { iFile, iGrid, iTab, iWindow } from '../../../../shared/types.shared';
import { ClientApiContext } from '../../hooks/api/api.hook';
import { getActiveWindowContent } from '../../hooks/app/tabs.hook';
import { initClipboardListener } from '../../managers/clipboard.manager';
import { initDragDropListener } from '../../managers/dragDrop.manager';
import { strings } from '../../managers/strings.manager';
import { iUploadedFile } from '../../managers/upload.manager';
import { PathModifFn } from '../dualView/TitleEditor.component';
import { DraggableGrid } from './DraggableGrid.component';

const useNextState = () => {
	const [refresh, setRefresh] = useState<{ data: any, counter: number }>({ data: {}, counter: 0 })
	const cbRef = useRef<any>(null)
	const triggerNextState = (cb) => {
		console.log('0046 1 triggernextstate');
		cbRef.current = cb
		const nR = cloneDeep(refresh)
		nR.counter = nR.counter + 1
		setRefresh(nR)
	}
	useEffect(() => {
		console.log('0046 2 refresh useeffet');
		if (cbRef.current) cbRef.current()
	}, [refresh])
	return { triggerNextState }
}


//
// CONTEXT 
//
export type onFileDeleteFn = (file: iFile) => void
interface iUploadUpdate {
	file?: iUploadedFile
	progress?: number
	uploadCounter: number
}
interface iFileActionsGridContext {
	onTitleUpdate: PathModifFn
	onFileDelete: onFileDeleteFn
}

export interface iGridContext {
	upload: iUploadUpdate
	file: iFileActionsGridContext
}

const gridContextInit: iGridContext = {
	upload: {
		uploadCounter: 0
	},
	file: {
		onTitleUpdate: (oPath, nPath) => { },
		onFileDelete: filePath => { }
	}
}
export const GridContext = React.createContext<iGridContext>(gridContextInit);



//
// COMPONENT 
//

export const WindowGrid = (p: {
	tab: iTab
	onGridUpdate: (grid: iGrid) => void
}) => {
	const { tab } = { ...p }

	const api = useContext(ClientApiContext);

	const [gridContext, setGridContext] = useState<iGridContext>(gridContextInit)


	//
	// IF NO WINDOW, CLOSE IT
	//
	useEffect(() => {
		if (tab.grid.content.length === 0) {
			if (!api) return
			console.log(`0046 if tab has no window, close it`);
			api.tabs.close(tab.id)
		}
	}, [tab])


	//
	// ON FILE DELETE 
	//
	const onFileDelete: onFileDeleteFn = file => {
		if (!api) return
		// ask for confirm
		api.popup.confirm(`${strings.trashNote}`, () => {
			const h = `[FILE DELETE] 0046`

			// remove all windows having the same file
			const idsToRemove = api.ui.windows.getIdsFromFile(file.path)
			api.ui.windows.close(idsToRemove)

			console.log(`${h} deleting file ${file.path}`, idsToRemove)

			// need to refresh state, then refresh list
			setNextStateAction({ type: 'refreshFolderList', file })
		})
	}

	// FILES LIST REFRESH once update (delete/title) is done 
	const [nextAction, setNextStateAction] = useState<any>(null);
	useEffect(() => {
		if (!api || !nextAction) return
		if (nextAction.type === 'refreshFolderList') {
			const selectedFolder = api.ui.folders.selectedFolder
			if (selectedFolder === nextAction.file.folder) {
				api.ui.folders.changeTo(selectedFolder)
			}
		}
	}, [nextAction])

	//
	// ON TITLE UPDATE
	//
	const onTitleUpdate = (oPath, nPath) => {
		const h = `[RENAME TITLE] 0046`
		if (!api) return
		api.file.move(oPath, nPath, nfiles => {
			console.log(`${h} SUCCESS IN RENAMING`);

			console.log(`${h} 2`);
			// get new file from backend
			let nFile: iFile | null = null
			each(nfiles, file => { if (file.path === nPath) nFile = file })
			if (!nFile) return
			console.log(`${h} 3`, nFile);
			nFile = nFile as iFile

			// once move is done, get all windows Ids from that oldpath
			const idsToUpdate = api.ui.windows.getIdsFromFile(oPath)
			api.ui.windows.updateWindows(idsToUpdate, nFile)

			// need to refresh state, then refresh Folder list
			setNextStateAction({ type: 'refreshFolderList', file: nFile })
		})
	}


	// UPDATING CONTEXT FUNCTIONS
	const nGridContext: iGridContext = cloneDeep(gridContext)
	nGridContext.file.onFileDelete = onFileDelete
	nGridContext.file.onTitleUpdate = onTitleUpdate


	//
	// REACT TO DROP & CLIPBOARD
	//

	useEffect(() => {
		const handleUpload = file => {
			const mdFile = getActiveWindowContent(tab)?.file
			if (!mdFile) return

			console.log('003441 dragdrop OR clipboard', file, mdFile.name);
			api && api.upload.uploadFile({
				file,
				folderPath: mdFile.folder,
				onSuccess: res => {
					const nCtx = cloneDeep(gridContext)
					nCtx.upload.uploadCounter = nCtx.upload.uploadCounter + 1
					nCtx.upload.file = res
					delete nCtx.upload.progress
					setGridContext(nCtx)
				},
				onProgress: res => {
					const nCtx = cloneDeep(gridContext)
					delete nCtx.upload.file
					nCtx.upload.progress = res
					setGridContext(nCtx)
				}
			})
		}

		const cleanDragDrop = initDragDropListener({
			onDropped: handleUpload,
			onDragEnd: () => { console.log('003442 onDragEnd'); }
		})

		const cleanClipBoard = initClipboardListener({
			onImagePasted: handleUpload
		})

		return () => {
			// cleanup events
			cleanClipBoard();
			cleanDragDrop();
		}

	}, [p.tab])


	return (//jsx
		<StyledDiv>
			<div className="window-grid-wrapper">
				<GridContext.Provider value={nGridContext}>
					<DraggableGrid
						refresh={tab.refresh || 0}
						grid={tab.grid}
						onGridUpdate={p.onGridUpdate}
					/>
				</GridContext.Provider>
			</div>
		</StyledDiv>
	)//jsx
}
export const StyledDiv = styled.div`//css
		height: 100%;
    .window-grid-wrapper {
				height: 100%;
		}
`//css
