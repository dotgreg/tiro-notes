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
	file: iFile
	fileContent: string
	canEdit: boolean
	isActive: boolean
	isLeavingNote: boolean

	viewType?: iViewType
	onViewChange?: onViewChangeFn

	onFileEdited: onFileEditedFn
	onSavingHistoryFile: onSavingHistoryFileFn
	onLightboxClick: onLightboxClickFn
	onBackButton: Function
	onToggleSidebarButton: Function
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


	return <div
		className={`dual-view-wrapper view-${p.viewType} device-${deviceType()}`}
		onWheelCapture={e => { updateSyncScroll(e.deltaY) }}
	>
		<EditorArea
			file={p.file}
			posY={syncScrollY}
			fileContent={p.fileContent}
			canEdit={p.canEdit}
			isActive={p.isActive}


			isLeavingNote={p.isLeavingNote}

			onScroll={newYPercent => { }}
			onSavingHistoryFile={p.onSavingHistoryFile}
			onFileEdited={(path, content) => {
				p.onFileEdited(path, content)
				setPreviewContent(content)
			}}
			onBackButton={p.onBackButton}
			onToggleSidebarButton={p.onToggleSidebarButton}
			onLightboxClick={p.onLightboxClick}
			onViewToggle={(view: iViewType) => { if (p.onViewChange) p.onViewChange(view) }}

			onMaxYUpdate={(maxY) => { updateMaxY(maxY) }}
		/>

		<PreviewArea
			file={p.file}
			posY={syncScrollY}
			fileContent={previewContent}
			onMaxYUpdate={(maxY) => { updateMaxY(maxY) }}
		/>


		<ScrollingBar
			percent={percentScrolled}
			onUpdated={(percent: number) => {
				setPosY(fromPercentToPxY(percent))
			}} />

	</div>
}






