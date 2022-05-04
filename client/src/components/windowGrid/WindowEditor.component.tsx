import { debounce } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import { iWindowContent } from '../../../../shared/types.shared';
import { ClientApiContext } from '../../hooks/api/api.hook';
import { DualViewer, onViewChangeFn } from '../dualView/DualViewer.component';

export const WindowEditor = (p: {
	content: iWindowContent
	onViewChange: onViewChangeFn
}) => {

	const { file, view, active } = { ...p.content }

	const [fileContent, setFileContent] = useState('')

	const api = useContext(ClientApiContext);

	//
	// GET CONTENT 
	//
	useEffect(() => {
		if (!file) return
		console.log(file.path);
		api && api.file.getContent(file.path, content => {
			setFileContent(content)
		})
	}, [file?.path])


	//
	// UPDATE CONTENT 
	//
	const onFileEditedSaveIt = (filepath: string, content: string) => {
		api && api.file.saveContent(filepath, content)
	}

	const debouncedOnFileEditedSaveIt = debounce(onFileEditedSaveIt, 1000)




	return (//jsx
		<>
			{
				file &&
				<div className="window-editor-wrapper">
					<DualViewer
						file={file}
						fileContent={fileContent}
						canEdit={true}
						isActive={active}
						isLeavingNote={false}
						viewType={view}
						onViewChange={p.onViewChange}
						onFileEdited={debouncedOnFileEditedSaveIt}
						onSavingHistoryFile={() => { }}
						onLightboxClick={() => { }}
						onBackButton={() => { }}
						onToggleSidebarButton={() => { }}
					/>
				</div>
			}
		</>)//jsx

}
