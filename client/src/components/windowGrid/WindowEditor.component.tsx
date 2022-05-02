import styled from '@emotion/styled';
import { debounce } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import { iFile, iViewType } from '../../../../shared/types.shared';
import { getClientApi } from '../../managers/api/api.manager';
import { DualViewer, onViewChangeFn } from '../dualView/DualViewer.component';


// if 2 files are the same
// windowEditor
// dualviewer > onFileEdited
// >>> windoweditor > on fileEdited file/filecontent
// >>> DraggableGrid >
// ============= checkIfOtherWindowSameFile(file)
// if yes => setIntContent(nContent); inside content.refresh
// then here windowEditor params refresh={intContent[i].refresh}
// =============
// windowEditor useEffect refresh => getFileContent

export const WindowEditor = (p: {
	file: iFile | undefined
	view: iViewType
	onViewChange: onViewChangeFn
}) => {

	const { file } = { ...p }

	const [fileContent, setFileContent] = useState('')

	//
	// GET CONTENT 
	//
	useEffect(() => {
		if (!file) return
		getClientApi().then(api => {
			api.file.getContent(file.path, content => {
				setFileContent(content)
			})
		})
	}, [p.file])


	//
	// UPDATE CONTENT 
	//
	const onFileEditedSaveIt = (filepath: string, content: string) => {
		getClientApi().then(api => {
			api.file.saveContent(filepath, content)
		})
	}

	const debouncedOnFileEditedSaveIt = debounce(onFileEditedSaveIt, 1000)




	return (<>
		{
			file &&
			<div className="window-editor-wrapper">
				<DualViewer
					file={file}
					fileContent={fileContent}
					canEdit={true}
					forceRender={true}
					isLeavingNote={false}

					viewType={p.view}

					onViewChange={p.onViewChange}
					onFileEdited={debouncedOnFileEditedSaveIt}

					onFileTitleEdited={() => { }}
					onSavingHistoryFile={() => { }}
					onFileDelete={() => { }}
					onLightboxClick={() => { }}
					onBackButton={() => { }}
					onToggleSidebarButton={() => { }}
				/>
			</div>
		}
	</>)

}
