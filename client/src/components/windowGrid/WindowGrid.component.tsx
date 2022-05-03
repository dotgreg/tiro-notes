import styled from '@emotion/styled';
import { cloneDeep } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import { iGrid, iTab, iWindow } from '../../../../shared/types.shared';
import { ClientApiContext } from '../../hooks/api/clientApi.hook';
import { getActiveWindowContent } from '../../hooks/app/tabs.hook';
import { initClipboardListener } from '../../managers/clipboard.manager';
import { initDragDropListener } from '../../managers/dragDrop.manager';
import { iUploadedFile } from '../../managers/upload.manager';
import { DraggableGrid } from './DraggableGrid.component';


export interface iUploadUpdate {
	file?: iUploadedFile
	progress?: number
	uploadCounter: number
}
const uploadUpdateInit: iUploadUpdate = { uploadCounter: 0 }
export const UploadUpdateContext = React.createContext<iUploadUpdate>(uploadUpdateInit);

export const WindowGrid = (p: {
	tab: iTab
	onGridUpdate: (grid: iGrid) => void
}) => {
	const { tab } = { ...p }

	const api = useContext(ClientApiContext);

	//
	// REACT TO DROP & CLIPBOARD
	//
	const [uploadUpdate, setUploadUpdate] = useState<iUploadUpdate>(uploadUpdateInit)
	useEffect(() => {
		const handleUpload = file => {
			const mdFile = getActiveWindowContent(tab)?.file
			if (!mdFile) return

			console.log('003441 dragdrop OR clipboard', file, mdFile.name);
			api && api.upload.uploadFile({
				file,
				folderPath: mdFile.folder,
				onSuccess: res => {
					const nUpdate = cloneDeep(uploadUpdate)
					nUpdate.uploadCounter = nUpdate.uploadCounter + 1
					nUpdate.file = res
					delete nUpdate.progress
					setUploadUpdate(nUpdate)
				},
				onProgress: res => {
					const nUpdate = cloneDeep(uploadUpdate)
					delete nUpdate.file
					nUpdate.progress = res
					setUploadUpdate(nUpdate)
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


// is title edited
// titleInput > editorArea > dualwrapper > windowEditor > draggable > windowGrid > app.tsx

// v1
// titleInput > editorarea > api.moveFile + 

// v2
// titleInput > editorarea >  windowEditor > draggable > windowGrid

// v3
// on windowGrid TitleUpdateContext onTitleUpdate
// titleInput TitleUpdate

// v4
// on windowGrid
// FileActionsContext 
// => 

return (//jsx
	<StyledDiv>
		<div className="window-grid-wrapper"
			onClick={() => {
			}}
		>
			<UploadUpdateContext.Provider value={uploadUpdate}>
				<DraggableGrid refresh={tab.refresh || 0}
					grid={tab.grid}
					onGridUpdate={p.onGridUpdate}
				/>
			</UploadUpdateContext.Provider>
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
