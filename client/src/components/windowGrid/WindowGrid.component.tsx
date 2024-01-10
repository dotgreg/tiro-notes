import styled from '@emotion/styled';
import { cloneDeep, each, random } from 'lodash-es';
import React, { useContext, useEffect, useState } from 'react';
import { iFile, iGrid, iTab } from '../../../../shared/types.shared';
import { ClientApiContext, getApi } from '../../hooks/api/api.hook';
import { useNextState } from '../../hooks/useNextStateAction.hook';
import { iMobileView } from '../../managers/device.manager';
import { strings } from '../../managers/strings.manager';
import { iUploadedFile } from '../../managers/upload.manager';
import { PathModifFn } from '../dualView/TitleEditor.component';
import { DraggableGrid } from './DraggableGrid.component';
import { iPinStatuses } from '../../hooks/app/usePinnedInterface.hook';

//
// CONTEXT 
//
export type onFileDeleteFn = (file: iFile) => void
interface iUploadUpdate {
	file?: iUploadedFile
	progress?: number
	markdownFile?: iFile,
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
	forceRefresh: number
	onGridUpdate: (grid: iGrid) => void
	mobileView: iMobileView
	pinStatus: iPinStatuses
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
			api.lastNotesApi?.removeFile(file.path)
			api.file.delete(file, nFiles => {
				const widToReplace = api.ui.windows.getIdsFromFile(file.path)
				// api.ui.windows.close(idsToRemove)
				// console.log(`${h} SUCCESS DELETING FILE, => remove all windows having the same file ${file.path}`, idsToRemove)

				// api.ui.windows.updateWindows()
				// load first note 
				const nFile = nFiles[nFiles.length - 1]
				let lastFile: iFile = nFiles[0]
				each(nFiles, f => { if ((f.modified && lastFile.modified) && f.modified > lastFile.modified) lastFile = f })
				// console.log(`${h} update to last window`);

				// need to refresh state, then refresh list
				onNextStateTrigger({ name: 'refreshFolderList', data: lastFile })
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
			// console.log(`${h} SUCCESS IN RENAMING`);

			let nFile: iFile | null = null
			each(nfiles, file => { if (file.path === nPath) nFile = file })
			if (!nFile) return
			nFile = nFile as iFile
			// 
			// console.log(`${h} get new file from backend`);
			const idsToUpdate = api.ui.windows.getIdsFromFile(oPath)
			api.ui.windows.updateWindows(idsToUpdate, nFile)

			// remove mention inside nodeHistory  LastNotes
			api.lastNotesApi?.removeFile(oPath)

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
		const selectedFolder = api.ui.browser.folders.current.get()
		if (selectedFolder === data.folder) {
			api.ui.browser.goTo(selectedFolder, data.name, { openIn: 'activeWindow' })
			onNextStateTrigger({ name: 'checkIfNoWindows' })
		}
	})

	addNextStateAction('checkIfNoWindows', api => {
		if (tab.grid.content.length === 0) {
			// console.log(`0046 tab "${tab.name}" has no window, close it`);
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

	const [forceRefresh, setForceRefresh] = useState(0)
	useEffect(() => {
		setForceRefresh(forceRefresh + 1)
	}, [tab.refresh, JSON.stringify(p.pinStatus), p.forceRefresh])


	return (//jsx
		<StyledDiv>
			<div className="window-grid-wrapper">
				<GridContext.Provider value={nGridContext}>
					<DraggableGrid
						refresh={forceRefresh}
						grid={tab.grid}
						onGridUpdate={p.onGridUpdate}
						mobileView={p.mobileView}
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
