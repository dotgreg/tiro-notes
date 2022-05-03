import styled from '@emotion/styled';
import { cloneDeep } from 'lodash';
import { title } from 'process';
import React, { useContext, useEffect, useState } from 'react';
import { iGrid, iTab, iWindow } from '../../../../shared/types.shared';
import { ClientApiContext } from '../../hooks/api/api.hook';
import { getActiveWindowContent } from '../../hooks/app/tabs.hook';
import { initClipboardListener } from '../../managers/clipboard.manager';
import { initDragDropListener } from '../../managers/dragDrop.manager';
import { iUploadedFile } from '../../managers/upload.manager';
import { PathModifFn } from '../dualView/TitleEditor.component';
import { DraggableGrid } from './DraggableGrid.component';


//
// CONTEXT 
//
interface iUploadUpdate {
	file?: iUploadedFile
	progress?: number
	uploadCounter: number
}
interface iTitleGridContext {
	onTitleUpdate: PathModifFn
}

export interface iGridContext {
	upload: iUploadUpdate
	title: iTitleGridContext
}

const gridContextInit: iGridContext = {
	upload: {
		uploadCounter: 0
	},
	title: {
		onTitleUpdate: (oPath, nPath) => { }
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
	// ON TITLE UPDATE
	//
	useEffect(() => {
		gridContext.title.onTitleUpdate = (oPath, nPath) => {
			if (!api) return
			console.log('hello from window grid, new title: ', oPath, nPath);
			const cfile = getActiveWindowContent(tab)?.file
			if (!cfile) return
			api.popup.confirm(
				`
${cfile.folder}
${oPath} -> ${nPath}
are you sure?
					`,
				() => {
					api.move.file(oPath, nPath)
				})
		}
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
