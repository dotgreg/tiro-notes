import styled from '@emotion/styled';
import React, { useContext, useEffect, useState } from 'react';
import { iFile, iGrid, iTab, iWindow } from '../../../../shared/types.shared';
import { getClientApi } from '../../hooks/app/clientApi.hook';
import { DualViewer } from '../dualView/DualViewer.component';

export const WindowEditor = (p: {
	file: iFile | undefined
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
			<StyledDiv>
				<div className="window-editor-wrapper">
					{/* =========
					{fileContent}
					========= */}
					<DualViewer
						file={file}
						fileContent={fileContent}
						canEdit={true}
						forceRender={true}
						isLeavingNote={false}
						onFileEdited={() => { }}
						onFileTitleEdited={() => { }}
						onSavingHistoryFile={() => { }}
						onFileDelete={() => { }}
						onLightboxClick={() => { }}
						onBackButton={() => { }}
						onToggleSidebarButton={() => { }}
					/>
				</div>
			</StyledDiv>
		}
	</>)

}
export const StyledDiv = styled.div`
    .window-editor-wrapper {
		}
`
