import { isBoolean } from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import { iViewType, iWindowContent } from '../../../../shared/types.shared';
import { getApi } from '../../hooks/api/api.hook';
import { useDebounce } from '../../hooks/lodash.hooks';
import { MobileView } from '../../managers/device.manager';
import { addLocalNoteHistory, iLocalNoteHistory } from '../../managers/localNoteHistory.manager';
import { getNoteView } from '../../managers/windowViewType.manager';
import { DualViewer, onViewChangeFn } from '../dualView/DualViewer.component';

export const WindowEditorInt = (p: {
	content: iWindowContent
	onViewChange: onViewChangeFn

	mobileView: MobileView
}) => {

	const { file, view, active, i } = { ...p.content }

	const [fileContent, setFileContent] = useState('')
	const [intViewType, setIntViewType] = useState<iViewType>()

	useEffect(() => {
		setIntViewType(view)
		// get the backend cached view type
		getNoteView(file?.path as string).then(res => {
			if (res) setIntViewType(res)
		})

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
				setFileContent(content)
				setCanEdit(true)
			})


			// WATCH LOGIC
			api.watch.file(file.path, watchUpdate => {
				// THEN WATCH FOR UPDATE BY OTHER CLIENTS
				if (filePathRef.current !== watchUpdate.filePath) return
				// if (deviceType() !== "desktop") return

				// if watcher gives an update to a file we are currently editing
				// make it inside a debounce, only for desktop
				if (
					isBeingEdited.current === true
				) return waitingContentUpdate.current = watchUpdate.fileContent

				setFileContent(watchUpdate.fileContent)
			})
		})
	}, [file?.path, fileContent])

	// can edit locally if file loading/not
	const [canEdit, setCanEdit] = useState(false)




	//
	// STATUS UPDATE if disconnected/offline
	//
	const addToLocalNoteHistoryDebounced = useDebounce((p:iLocalNoteHistory) => {
		addLocalNoteHistory(p, 20, true)
	}, 3000)

	const contentToUpdateOnceOnline = useRef<{ path?: string, content?: string }>({})
	const disconnectCounter = useRef<number>(0)
	useEffect(() => {
		let ct = contentToUpdateOnceOnline.current
		getApi(api => {
			api.watch.appStatus(status => {
				if (status.isConnected === false) {
					disconnectCounter.current = disconnectCounter.current + 1
				} else if (status.isConnected === true) {
					let isReconnected = disconnectCounter.current >= 1 && status.isConnected
					if (isReconnected) {
						getApi(api => {
							let filepath: any = file?.path
							//console.log("2 RECONNECTION", filepath, ct);
							if (!filepath || !ct) return
							if (!ct.path) return
							if (filepath !== ct.path) return
							if (!ct.content) return
							let content = ct.content
							console.log("3 UPDATE OFFLINE CONTENT", { filepath, content });
							// UPDATE SEVERAL TIMES to make sure the content from server do not erase the offline content
							api.file.saveContent(filepath, content, { history: true })
							setTimeout(() => {
								api.file.saveContent(filepath, content, { history: true })
								setTimeout(() => {
									api.file.saveContent(filepath, content, { history: true })
									setTimeout(() => {
										api.file.saveContent(filepath, content, { history: true })
									}, 100)
								}, 10)
							}, 10)

						})
					}
				}
			})
		})
	}, [file?.path])



	//
	// UPDATE CONTENT 
	//
	const onFileEditedSaveIt = (filepath: string, content: string) => {
		getApi(api => {
			api.file.saveContent(filepath, content, { history: true })
		})
		isBeingEdited.current = true
		isEditedDebounce()
		// OLD MECANISM
		contentToUpdateOnceOnline.current = { content, path: file?.path }

		// LOCAL HIST NOTE UPDATE
		addToLocalNoteHistoryDebounced({
			path: filepath,
			content,
			timestamp: Date.now()
		})
	}

	const waitingContentUpdate = useRef<string | false>(false)
	const isBeingEdited = useRef<boolean>(false)
	const isEditedDebounce = useDebounce(() => {
		isBeingEdited.current = false

		// only if we have some modification to update
		if (isBoolean(waitingContentUpdate.current)) return
		waitingContentUpdate.current = false
	}, 2000)



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
								 mobileView={p.mobileView}

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
	let res = true
	if (c1 !== c2) res = false
	return res
})
