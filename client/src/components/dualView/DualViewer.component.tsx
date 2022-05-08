import React, { useEffect, useRef, useState } from 'react';
import { PreviewArea } from './PreviewArea.component'
import { EditorArea, onFileEditedFn, onLightboxClickFn, onSavingHistoryFileFn } from './EditorArea.component';
import { iFile, iViewType } from '../../../../shared/types.shared';
import { PathModifFn } from './TitleEditor.component';
import { useSyncScroll } from '../../hooks/syncScroll.hook';
import { deviceType } from '../../managers/device.manager';
import { clamp } from 'lodash';
import { ScrollingBar } from './Scroller.component';

export type onViewChangeFn = (nView: iViewType) => void

export const DualViewer = (p: {
	windowId: string
	file: iFile
	fileContent: string
	isActive: boolean

	viewType?: iViewType
	onViewChange?: onViewChangeFn

	onFileEdited: onFileEditedFn
}) => {


	const [previewContent, setPreviewContent] = useState('')

	// calculate max Y for custom scroller bar
	const [maxY, setMaxY] = useState(0)
	const updateMaxY = (newMaxY) => {
		if (newMaxY > maxY) setMaxY(newMaxY)
	}


	useEffect(() => {
		setMaxY(0)
	}, [p.fileContent])

	// calculate percent scrolled by natural scroll
	const [percentScrolled, setPercentScrolled] = useState(0)
	const { syncScrollY, updateSyncScroll, setPosY } = useSyncScroll(maxY)

	useEffect(() => {
		setPercentScrolled(fromPxToPercentY(syncScrollY));
	}, [syncScrollY, maxY])

	const fromPxToPercentY = (nPx) => clamp(Math.round((nPx / maxY) * 100), 0, 100);
	const fromPercentToPxY = (nPercent) => (nPercent / 100) * maxY

	useEffect(() => {
		setPreviewContent(p.fileContent)
	}, [p.fileContent])

	// back to top when change file
	useEffect(() => {
		setPosY(1);
	}, [p.file.path])

	// for performance reasons, only show editor/preview when needed
	//const showEditor = !(p.viewType === 'preview')
	// dang, editor is required... cuz of dropdown menu
	const showEditor = true
	const showPreview = !(p.viewType === 'editor' && deviceType() !== 'mobile')

	return <div
		className={`dual-view-wrapper view-${p.viewType} device-${deviceType()}`}
		onWheelCapture={e => { updateSyncScroll(e.deltaY) }}
	>
		{showEditor &&
			<EditorArea
				file={p.file}
				fileContent={p.fileContent}
				isActive={p.isActive}

				posY={syncScrollY}
				onScroll={newYPercent => { }}
				onMaxYUpdate={(maxY) => { updateMaxY(maxY) }}

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
				posY={syncScrollY}
				fileContent={previewContent}
				onMaxYUpdate={(maxY) => { updateMaxY(maxY) }}
			/>
		}


		<ScrollingBar
			percent={percentScrolled}
			onUpdated={(percent: number) => {
				setPosY(fromPercentToPxY(percent))
			}} />

	</div>
}






