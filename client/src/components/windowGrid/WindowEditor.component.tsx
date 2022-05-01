import styled from '@emotion/styled';
import React, { useContext, useEffect, useState } from 'react';
import { iFile, iViewType } from '../../../../shared/types.shared';
import { getClientApi } from '../../hooks/app/clientApi.hook';
import { DualViewer, onViewChangeFn } from '../dualView/DualViewer.component';

export const WindowEditor = (p: {
	file: iFile | undefined
	view: iViewType
	onViewChange: onViewChangeFn
}) => {

	const { file } = { ...p }

	const [fileContent, setFileContent] = useState('')
	useEffect(() => {
		if (!file) return
		getClientApi().then(api => {
			api.getFileContent(file.path, content => {
				setFileContent(content)
			})
		})
	}, [p.file])

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

						onFileEdited={() => { }}
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
