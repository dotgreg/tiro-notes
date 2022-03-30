import React, { useEffect, useRef, useState } from 'react';
import { PreviewArea } from './PreviewArea.component'
import { EditorArea, onFileDeleteFn, onFileEditedFn, onLightboxClickFn, onSavingHistoryFileFn } from './EditorArea.component';
import { iFile } from '../../../../shared/types.shared';
import { PathModifFn } from './TitleEditor.component';
import { useSyncScroll } from '../../hooks/syncScroll.hook';
import { useLocalStorage } from '../../hooks/useLocalStorage.hook';
import { addCliCmd } from '../../managers/cliConsole.manager';
import { addKeyAction, getKeyModif } from '../../managers/keys.manager';

//@TODO mobile bar
//@TODO mobile bar func to desktop
export type ViewType = 'editor' | 'both' | 'preview'

export const DualViewer = (p: {
	file: iFile
	fileContent: string
	// viewType:ViewType
	canEdit: boolean
	forceRender: boolean
	isLeavingNote: boolean
	onFileEdited: onFileEditedFn
	onFileTitleEdited: PathModifFn
	onSavingHistoryFile: onSavingHistoryFileFn
	onFileDelete: onFileDeleteFn
	onLightboxClick: onLightboxClickFn
	onBackButton: Function
	onToggleSidebarButton: Function
}) => {
	const { syncScrollY, updateSyncScroll, setPosY } = useSyncScroll()


	const [viewType, setViewType] = useLocalStorage('viewtype', 'both')
	const [previewContent, setPreviewContent] = useState('')

	// keyboard shortcuts
	useEffect(() => {
		addKeyAction('2', () => { if (getKeyModif('ctrl')) setViewType('editor') })
		addKeyAction('3', () => { if (getKeyModif('ctrl')) setViewType('both') })
		addKeyAction('4', () => { if (getKeyModif('ctrl')) setViewType('preview') })
	}, [viewType])

	// window variables
	addCliCmd('fileContent', {
		description: 'live updated currentFileContent',
		func: () => previewContent
	})




	const endTempViewType = useRef<string | null>(null);
	addCliCmd('setTempViewType', {
		description: 'setviewtype (both, preview, editor)',
		func: view => {
			endTempViewType.current = viewType;
			setViewType(view)
		}
	})

	// useEffect(() => {
	//     console.log('setviewtype', p.viewType);

	//     setViewType(p.viewType)
	// }, [p.viewType])

	useEffect(() => {
		setPreviewContent(p.fileContent)
		if (endTempViewType.current) {
			setViewType(endTempViewType.current)
			endTempViewType.current = null;
		}
	}, [p.fileContent])

	// back to top when change file
	useEffect(() => {
		setPosY(1);

	}, [p.file.path])

	return <div
		className={`dual-view-wrapper view-${viewType}`}
		onWheelCapture={e => { updateSyncScroll(e.deltaY) }}
	>
		<EditorArea
			file={p.file}
			posY={syncScrollY}
			fileContent={p.fileContent}
			canEdit={p.canEdit}

			isLeavingNote={p.isLeavingNote}

			onScroll={newYPercent => { }}
			onFileTitleEdited={p.onFileTitleEdited}
			onSavingHistoryFile={p.onSavingHistoryFile}
			onFileEdited={(path, content) => {
				p.onFileEdited(path, content)
				setPreviewContent(content)
			}}
			onFileDelete={p.onFileDelete}
			onBackButton={p.onBackButton}
			onToggleSidebarButton={p.onToggleSidebarButton}
			onLightboxClick={p.onLightboxClick}
			onViewToggle={() => {
				if (viewType === 'both') setViewType('editor')
				if (viewType === 'editor') setViewType('preview')
				if (viewType === 'preview') setViewType('both')
			}}
		/>

		<PreviewArea
			file={p.file}
			posY={syncScrollY}
			fileContent={previewContent}
		/>

	</div>
}






