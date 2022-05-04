import styled from '@emotion/styled';
import { cloneDeep, each } from 'lodash';
import { title } from 'process';
import React, { useContext, useEffect, useState } from 'react';
import { iFile, iGrid, iTab, iWindow } from '../../../../shared/types.shared';
import { ClientApiContext } from '../../hooks/api/api.hook';
import { getActiveWindowContent } from '../../hooks/app/tabs.hook';
import { initClipboardListener } from '../../managers/clipboard.manager';
import { initDragDropListener } from '../../managers/dragDrop.manager';
import { strings } from '../../managers/strings.manager';
import { iUploadedFile } from '../../managers/upload.manager';
import { PathModifFn } from '../dualView/TitleEditor.component';
import { DraggableGrid } from './DraggableGrid.component';


//
// CONTEXT 
//
export type onFileDeleteFn = (filepath: string) => void
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
	// ON FILE DELETE
	//
	const onFileDelete: onFileDeleteFn = filePath => {
		if (!api) return
		// ask for confirm
		api.popup.confirm(`${strings.trashNote}`, () => {
			// send delete
			console.log(`[FILE DELETE] 0046 deleting file ${filePath}`)
			// get active tab, if several window, close current one
			// if one window, close the tab
		})
	}

	//
	// ON TITLE UPDATE
	//
	const onTitleUpdate = (oPath, nPath) => {
		if (!api) return
		console.log('hello from window grid, new title: ', oPath, nPath);
		const c = getActiveWindowContent(tab)
		if (!c || !c.file) return
		oPath = `${c.file.folder}${oPath}.md`
		nPath = `${c.file.folder}${nPath}.md`
		api.file.move(oPath, nPath, nfiles => {
			// get files scanned after the move is completed
			if (!c || !c.file) return
			// update file of active window
			let nFileContent: iFile | null = null
			each(nfiles, file => { if (file.path === nPath) nFileContent = file })
			if (!nFileContent) return
			c.file = nFileContent
			console.log('[FILE TITLE] 0045 renaming file title and updating current grid');
			p.onGridUpdate(tab.grid)
			// TODO ask for file list refresh
			//api.uiFilesList.reload()
		})
	}

	useEffect(() => {
		gridContext.file.onTitleUpdate = onTitleUpdate
		gridContext.file.onFileDelete = onFileDelete
		setGridContext(gridContext)
	}, [])



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
			<div className="window-grid-wrapper"
				onClick={() => {
				}}
			>
				<GridContext.Provider value={gridContext}>
					<DraggableGrid refresh={tab.refresh || 0}
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
