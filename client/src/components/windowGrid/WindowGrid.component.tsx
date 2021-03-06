import styled from '@emotion/styled';
import { cloneDeep, each } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import { iFile, iGrid, iTab } from '../../../../shared/types.shared';
import { ClientApiContext } from '../../hooks/api/api.hook';
import { getActiveWindowContent } from '../../hooks/app/tabs.hook';
import { useNextState } from '../../hooks/useNextStateAction.hook';
import { initClipboardListener } from '../../managers/clipboard.manager';
import { initDragDropListener } from '../../managers/dragDrop.manager';
import { strings } from '../../managers/strings.manager';
import { iUploadedFile } from '../../managers/upload.manager';
import { PathModifFn } from '../dualView/TitleEditor.component';
import { DraggableGrid } from './DraggableGrid.component';

//
// CONTEXT 
//
export type onFileDeleteFn = (file: iFile) => void
interface iUploadUpdate {
	file?: iUploadedFile
	progress?: number
	uploadCounter: number
	reinit: Function
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
		uploadCounter: 0,
		reinit: () => { }
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
	// ON FILE DELETE 
	//
	const onFileDelete: onFileDeleteFn = file => {
		if (!api) return
		api.popup.confirm(`${strings.trashNote}`, () => {
			const h = `[FILE DELETE] 0046`

			api.file.delete(file, nFiles => {
				const idsToRemove = api.ui.windows.getIdsFromFile(file.path)
				api.ui.windows.close(idsToRemove)
				console.log(`${h} SUCCESS DELETING FILE, => remove all windows having the same file ${file.path}`, idsToRemove)

				// need to refresh state, then refresh list
				onNextStateTrigger({ name: 'refreshFolderList', data: file })
			})
		})
	}

	//
	// ON TITLE UPDATE
	//
	const onTitleUpdate = (oPath, nPath) => {
		const h = `[RENAME TITLE] 0046`
		if (!api) return
		api.file.move(oPath, nPath, nfiles => {
			console.log(`${h} SUCCESS IN RENAMING`);

			let nFile: iFile | null = null
			each(nfiles, file => { if (file.path === nPath) nFile = file })
			if (!nFile) return
			nFile = nFile as iFile

			// 
			console.log(`${h} get new file from backend`);
			const idsToUpdate = api.ui.windows.getIdsFromFile(oPath)
			api.ui.windows.updateWindows(idsToUpdate, nFile)

			// need to refresh state, then refresh Folder list
			onNextStateTrigger({ name: 'refreshFolderList', data: nFile })
		})
	}

	//
	// NEXT STATES ACTIONS
	//
	const { onNextStateTrigger, addNextStateAction } = useNextState()

	// need to perform some actions after updated state
	addNextStateAction('refreshFolderList', (api, data) => {
		const selectedFolder = api.ui.browser.folders.current.get
		if (selectedFolder === data.folder) {
			console.log(`0046 refreshFolderList ${selectedFolder}`);
			api.ui.browser.goTo(selectedFolder)
			onNextStateTrigger({ name: 'checkIfNoWindows' })
		}
	})

	addNextStateAction('checkIfNoWindows', api => {
		if (tab.grid.content.length === 0) {
			console.log(`0046 tab "${tab.name}" has no window, close it`);
			api.tabs.close(tab.id)
		}
	})

	// UPDATING CONTEXT FUNCTIONS
	const nGridContext: iGridContext = cloneDeep(gridContext)
	nGridContext.file.onFileDelete = onFileDelete
	nGridContext.file.onTitleUpdate = onTitleUpdate

	nGridContext.upload.reinit = () => {
		const nCtx = cloneDeep(gridContext)
		delete nCtx.upload.file
		setGridContext(nCtx)
	}


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
