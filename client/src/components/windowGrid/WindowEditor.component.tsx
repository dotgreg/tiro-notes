import React, { useContext, useEffect, useRef, useState } from 'react';
import { iWindowContent } from '../../../../shared/types.shared';
import { ClientApiContext, getApi } from '../../hooks/api/api.hook';
import { DualViewer, onViewChangeFn } from '../dualView/DualViewer.component';

export const WindowEditorInt = (p: {
	content: iWindowContent
	onViewChange: onViewChangeFn
}) => {

	const { file, view, active, i } = { ...p.content }

	const [fileContent, setFileContent] = useState('')

	//
	// GET CONTENT 
	//
	useEffect(() => {
		setCanEdit(false)

		if (!file) return
		getApi(api => {
			// LOAD CONTENT FIRST
			api.file.getContent(file.path, content => {
				setFileContent(content)
				setCanEdit(true)
			})


			// THEN WATCH FOR UPDATE BY OTHER CLIENTS
			api.watch.file(file.path, content => {
				console.log(2222222222222, content, file.path);
				setFileContent(content)
			})
		})
	}, [file?.path])

	// can edit locally if file loading/not
	const [canEdit, setCanEdit] = useState(false)

	//
	// UPDATE CONTENT 
	//
	const onFileEditedSaveIt = (filepath: string, content: string) => {
		getApi(api => {
			api.file.saveContent(filepath, content, { history: true })
		})

	}


	// ON ACTIVE, LOAD LIST
	useEffect(() => {
		if (!file || !active) return
		getApi(api => {
			api.ui.browser.goTo(file.folder, file.name)
		})
	}, [active])

	return (
		<>

			{
				file &&
				<div className="window-editor-wrapper">
					<DualViewer
						windowId={i}
						file={file}
						fileContent={fileContent}
						isActive={active}
						canEdit={canEdit}

						viewType={view}
						onViewChange={p.onViewChange}

						onFileEdited={(path, content) => {
							onFileEditedSaveIt(path, content);
						}}
					/>
				</div>
			}
		</>)

}


export const WindowEditor = React.memo(WindowEditorInt, (np, pp) => {
	return false
	let c1 = JSON.stringify(np)
	let c2 = JSON.stringify(pp)
	// console.log(c1, c2, c1 === c2);
	let res = true
	if (c1 !== c2) res = false
	return res
})
