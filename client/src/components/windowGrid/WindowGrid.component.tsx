import styled from '@emotion/styled';
import { cloneDeep } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import { iGrid, iTab, iWindow } from '../../../../shared/types.shared';
import { ClientApiContext } from '../../hooks/api/api.hook';
import { getActiveWindowContent } from '../../hooks/app/tabs.hook';
import { initClipboardListener } from '../../managers/clipboard.manager';
import { initDragDropListener } from '../../managers/dragDrop.manager';
import { iUploadedFile } from '../../managers/upload.manager';
import { DraggableGrid } from './DraggableGrid.component';


//
// CONTEXT 
//
interface iUploadUpdate {
	file?: iUploadedFile
	progress?: number
	uploadCounter: number
}

export interface iGridContext {
	upload: iUploadUpdate
}

const gridContextInit: iGridContext = {
	upload: {
		uploadCounter: 0
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

	//
	// REACT TO DROP & CLIPBOARD
	//
	const [gridContext, setGridContext] = useState<iGridContext>(gridContextInit)

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
