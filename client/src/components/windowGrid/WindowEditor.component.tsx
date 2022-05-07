import { debounce, throttle } from 'lodash';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { iWindowContent } from '../../../../shared/types.shared';
import { ClientApiContext } from '../../hooks/api/api.hook';
import { DualViewer, onViewChangeFn } from '../dualView/DualViewer.component';

export const WindowEditor = (p: {
	content: iWindowContent
	onViewChange: onViewChangeFn
}) => {

	const { file, view, active, i } = { ...p.content }

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
		console.log('0046 save content');
		api && api.file.saveContent(filepath, content, { history: true })
	}
	const debouncedOnFileEditedSaveIt = debounce(onFileEditedSaveIt, 1000)

	//
	// FORCE LIST FILES REFRESH
	//
	const refreshFilesList = () => {
		console.log('0046 refresh list after file edit');
		api && api.ui.browser.goTo(api.ui.browser.folders.current.get)
	}
	const debouncedRefreshList = debounce(refreshFilesList, 5000)

	return (//jsx
		<>
			{
				file &&
				<div className="window-editor-wrapper">
					<DualViewer
							windowId={i}
						file={file}
						fileContent={fileContent}
						isActive={active}

						viewType={view}
						onViewChange={p.onViewChange}

						onFileEdited={(path, content) => {
							//debouncedOnFileEditedSaveIt(path, content)
							onFileEditedSaveIt(path, content);
							//throttRefresh()
							// debouncedRefreshList();
							//updateRefreshList();
						}}
					/>
				</div>
			}
		</>)//jsx

}
