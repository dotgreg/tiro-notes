import React, { useContext, useEffect, useRef, useState } from 'react';
import { iViewType, iWindowContent } from '../../../../shared/types.shared';
import { getApi } from '../../hooks/api/api.hook';
import { getContentViewTag, getNoteView } from '../../managers/windowViewType.manager';
import { DualViewer, onViewChangeFn } from '../dualView/DualViewer.component';

export const WindowEditorInt = (p: {
	content: iWindowContent
	onViewChange: onViewChangeFn
}) => {

	const { file, view, active, i } = { ...p.content }

	const [fileContent, setFileContent] = useState('')
	const [intViewType, setIntViewType] = useState<iViewType>()

	useEffect(() => {
		setIntViewType(view)
	}, [view, file?.path])

	//
	// GET CONTENT 
	//
	let filePathRef = useRef<string>(file?.path || "")

	useEffect(() => {
		filePathRef.current = file?.path || ""

		setCanEdit(false)

		if (!file) return
		getApi(api => {
			// LOAD CONTENT FIRST
			api.file.getContent(file.path, content => {

				// IF '--view-IVIEWTYPE' like '--view-editor' found inside the content,
				// change the window view else come back to lastViewType
				// let contentViewType = getContentViewTag(content)
				// contentViewType ? setIntViewType(contentViewType) : setIntViewType(view)
				getNoteView(file.path).then(res => {
					if (res) setIntViewType(res)
				})

				setFileContent(content)
				setCanEdit(true)
			})


			// THEN WATCH FOR UPDATE BY OTHER CLIENTS
			api.watch.file(file.path, watchUpdate => {
				if (filePathRef.current === watchUpdate.filePath) {
					setFileContent(watchUpdate.fileContent)
				}
			})
		})
	}, [file?.path, fileContent])

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

						viewType={intViewType}
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
