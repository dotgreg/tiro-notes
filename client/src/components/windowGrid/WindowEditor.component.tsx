import styled from '@emotion/styled';
import React, { useContext, useEffect, useState } from 'react';
import { iFile, iGrid, iTab, iWindow } from '../../../../shared/types.shared';
import { ClientApiContext } from '../../hooks/app/clientApi.hook';
import { DualViewer } from '../dualView/DualViewer.component';

export const WindowEditor = (p: {
	file: iFile | undefined
}) => {

	const { file } = { ...p }

	const clientApi = useContext(ClientApiContext)

	const [fileContent, setFileContent] = useState('')
	useEffect(() => {
		if (!clientApi || !clientApi.getFileContent || !file) return
		clientApi.getFileContent(file.path, content => {
			setFileContent(content)
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
	onFileEdited={()=>{}}
	onFileTitleEdited={()=>{}}
	onSavingHistoryFile={()=>{}}
	onFileDelete={()=>{}}
	onLightboxClick={()=>{}}
	onBackButton={()=>{}}
	onToggleSidebarButton={()=>{}}
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
