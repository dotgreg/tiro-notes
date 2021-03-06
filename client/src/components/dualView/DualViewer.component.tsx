import React, { useContext, useEffect, useRef, useState } from 'react';
import { PreviewArea } from './PreviewArea.component'
import { EditorArea, onFileEditedFn, onLightboxClickFn, onSavingHistoryFileFn } from './EditorArea.component';
import { iFile, iViewType } from '../../../../shared/types.shared';
import { useSyncScroll } from '../../hooks/syncScroll.hook';
import { deviceType } from '../../managers/device.manager';
import { clamp } from 'lodash';
import { ScrollingBar } from './Scroller.component';
import { ClientApiContext } from '../../hooks/api/api.hook';

export type onViewChangeFn = (nView: iViewType) => void

export const DualViewer = (p: {
	windowId: string
	file: iFile
	fileContent: string
	isActive: boolean
	canEdit: boolean

	viewType?: iViewType
	onViewChange?: onViewChangeFn

	onFileEdited: onFileEditedFn
}) => {


	const [previewContent, setPreviewContent] = useState('')

	// calculate max Y for custom scroller bar
	const [maxY, setMaxY] = useState(0)
	const maxYRef = useRef(0)
	const updateMaxY = (newMaxY: number) => {
		if (newMaxY > maxYRef.current) maxYRef.current = newMaxY
		setMaxY(maxYRef.current)
	}


	useEffect(() => {
		setMaxY(0)
	}, [p.fileContent])

	// calculate percent scrolled by natural scroll
	const [percentScrolled, setPercentScrolled] = useState(0)
	const { getSyncY, setSyncY, yCnt, updateSyncYWithDelta } = useSyncScroll(maxY)

	useEffect(() => {
		setPercentScrolled(fromPxToPercentY(getSyncY()));
	}, [yCnt, maxY])

	const fromPxToPercentY = (nPx) => clamp(Math.round((nPx / maxY) * 100), 0, 100);
	const fromPercentToPxY = (nPercent) => (nPercent / 100) * maxY

	useEffect(() => {
		setPreviewContent(p.fileContent)
	}, [p.fileContent])

	// back to top when change file
	useEffect(() => {
		// setPosY(1);
		setSyncY(1)
	}, [p.file.path])

	//
	// JUMP TO LINE ACTIONS
	const api = useContext(ClientApiContext);
	const lineJumpEvent = api?.ui.note.lineJump.get
	const [lineToJump, setLineToJump] = useState(-1)
	useEffect(() => {
		// console.log("LINE JUMP ASKED", { lineJumpEvent, currWid: p.windowId });
		if (!lineJumpEvent) return
		if (lineJumpEvent.windowId === "active") {
			lineJumpEvent.windowId = api?.ui.windows.active.get()?.content.i || ""
		}
		// console.log("LINE JUMP ASKED2 ", { lineJumpEvent, currWid: p.windowId });
		if (lineJumpEvent.windowId !== p.windowId) return
		// console.log("GOOD, DOING LINE JUMP");
		// LINE JUMP > EDITOR JUMP > UPDATE Y > SETPOSY HERE AGAIN
		setLineToJump(lineJumpEvent.line)
		// setPosY(lineJumpEvent.line * 20)
	}, [lineJumpEvent])


	// for performance reasons, only show editor/preview when needed
	//const showEditor = !(p.viewType === 'preview')
	// dang, editor is required... cuz of dropdown menu
	const showEditor = true
	const showPreview = !(p.viewType === 'editor' && deviceType() !== 'mobile')

	return <div
		className={`dual-view-wrapper view-${p.viewType} device-${deviceType()}`}
		onWheelCapture={e => { updateSyncYWithDelta(e.deltaY) }}
	>

		{showEditor &&
			<EditorArea
				file={p.file}
				canEdit={p.canEdit}
				fileContent={p.fileContent}
				isActive={p.isActive}

				jumpToLine={lineToJump}
				posY={getSyncY()}

				onScroll={newY => { }}
				onUpdateY={newY => {
					setSyncY(newY)
					// console.log("dual1", newY, syncScrollY);
					// setPosY(newY)
					// setTimeout(() => {
					// 	setPosY(newY)
					// })
					// setTimeout(() => {
					// console.log("dual2", syncScrollY, posY);
					// }, 100)
				}}
				onMaxYUpdate={updateMaxY}

				onFileEdited={(path, content) => {
					p.onFileEdited(path, content)
					setPreviewContent(content)
				}}

				onViewToggle={(view: iViewType) => { if (p.onViewChange) p.onViewChange(view) }}
			/>
		}

		{showPreview &&
			<PreviewArea
				windowId={p.windowId}
				file={p.file}
				posY={getSyncY()}
				fileContent={previewContent}
				onMaxYUpdate={updateMaxY}
			/>
		}


		<ScrollingBar
			percent={percentScrolled}
			onUpdated={(percent: number) => {
				// setPosY(fromPercentToPxY(percent))
				setSyncY(fromPercentToPxY(percent))

			}} />

	</div>
}






