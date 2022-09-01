import React, { useContext, useEffect, useRef, useState } from 'react';
import { PreviewArea } from './PreviewArea.component'
import { EditorArea, onFileEditedFn, onLightboxClickFn, onSavingHistoryFileFn } from './EditorArea.component';
import { iFile, iViewType } from '../../../../shared/types.shared';
import { useSyncScroll } from '../../hooks/syncScroll.hook';
import { deviceType } from '../../managers/device.manager';
import { clamp, each, isNumber } from 'lodash';
import { ScrollingBar } from './Scroller.component';
import { ClientApiContext } from '../../hooks/api/api.hook';
import { useDebounce, useThrottle } from '../../hooks/lodash.hooks';
import { getMdStructure, iMdPart } from '../../managers/markdown.manager';

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
		onSyncScroll()
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
		if (lineJumpEvent.windowId !== p.windowId) return
		// LINE JUMP > EDITOR JUMP > UPDATE Y > SETPOSY HERE AGAIN
		setLineToJump(lineJumpEvent.line)
		setTimeout(() => {
			// reinit jump
			setLineToJump(-1)
		}, 100)
		// setPosY(lineJumpEvent.line * 20)
	}, [lineJumpEvent])


	// for performance reasons, only show editor/preview when needed
	//const showEditor = !(p.viewType === 'preview')
	// dang, editor is required... cuz of dropdown menu
	const showEditor = true
	const showPreview = !(p.viewType === 'editor' && deviceType() !== 'mobile')

	///////////////////////////////////////
	// DIFFERENT SCROLLS
	// get information on currently scrolled line
	// to update preview scroll position on preview-scroll: follow-title
	//

	// 0) SHARED LOGIC
	type iScrollMode = "title" | "sync"
	const [scrollMode, setScrollMode] = useState<iScrollMode>("title")
	const [previewY, setPreviewY] = useState(0)

	const titleY = useRef(0)
	const offsetSyncFromTitle = useRef(0)

	// 1) SIMPLE SYNC SCROLL
	const onSyncScroll = () => {
		if (scrollMode === "sync") {
			setPreviewY(getSyncY())
		} else if (scrollMode === "title") {
			const t = titleY.current

			//// 1 TRYING TO GET A SCROLL FOR LONGER THINGS
			// const o = offsetSyncFromTitle.current
			// const a = getSyncY() - o
			// // const res = o + (getSyncY() - o)
			// const res = o + a
			// console.log({ res, t, a, sy: getSyncY(), o });

			setPreviewY(t)
		}
	}

	// 2) TITLE SCROLL
	const initTitle = { id: "", line: 0, title: "" }
	// const [scrolledTitle, setScrolledTitle] = useState<iMdPart>(initTitle)
	const updateScrolledTitle = useThrottle((scrolledLine: number) => {
		if (scrollMode !== "title") return;
		const struct = getMdStructure(previewContent)
		// get current title
		let cTitle: iMdPart = initTitle
		each(struct, title => { if (scrolledLine > title.line) cTitle = title })
		// update the preview scroll accordingly
		if (cTitle.id !== "") {
			const ePath = `.window-id-${p.windowId} #t-${cTitle.id}`
			try {
				let isViewWithMap = document.querySelector(`.window-id-${p.windowId}.view-editor-with-map`)

				// @ts-ignore
				let etop = document.querySelector(ePath)?.offsetTop

				// if (etop) setPreviewY(etop)
				if (isNumber(etop)) {
					const withMapOffset = isViewWithMap ? -80 : 0
					etop = etop - 10 + withMapOffset
					if (etop !== titleY.current) {
						offsetSyncFromTitle.current = getSyncY()
					}
					titleY.current = etop
				}
			} catch (e) {
				console.error(e);
			}
		}
	}, 200)

	return <div
		className={`dual-view-wrapper view-${p.viewType} device-${deviceType()} window-id-${p.windowId}`}
		onWheelCapture={e => {
			updateSyncYWithDelta(e.deltaY)
		}}
	>

		{showEditor &&
			<EditorArea

				file={p.file}
				canEdit={p.canEdit}
				fileContent={p.fileContent}
				isActive={p.isActive}

				jumpToLine={lineToJump}
				posY={getSyncY()}

				onScroll={newLine => {
					updateScrolledTitle(newLine)
				}}
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
				onScrollModeChange={checked => {
					const res = checked ? "title" : "sync"
					setScrollMode(res)
				}}

				onViewToggle={(view: iViewType) => { if (p.onViewChange) p.onViewChange(view) }}
			/>
		}

		{showPreview &&
			<PreviewArea
				windowId={p.windowId}
				file={p.file}
				posY={previewY}
				fileContent={previewContent}
				onMaxYUpdate={updateMaxY}
				yCnt={yCnt}
				onIframeMouseWheel={e => {
					updateSyncYWithDelta(e.deltaY)
				}}
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






