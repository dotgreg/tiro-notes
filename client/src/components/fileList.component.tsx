import { each } from 'lodash';
import React, { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { iFile, iFilePreview } from '../../../shared/types.shared';
import { ClientApiContext } from '../hooks/api/api.hook';
import { FilesPreviewObject } from '../hooks/api/files.api.hook';
import { sortFiles, SortModes, SortModesLabels } from '../managers/sort.manager';
import { cssVars } from '../managers/style/vars.style.manager';
import { Icon } from './Icon.component';
import { List, onFileDragStartFn } from "./List.component"

export const FilesList = (p: {
	files: iFile[]
	activeFileIndex: number,

	onSortFiles: (files: iFile[]) => void
	onFileClicked: (fileIndex: number) => void
	onFileDragStart: onFileDragStartFn
	onFileDragEnd: () => void
}) => {

	const api = useContext(ClientApiContext);


	//
	// FILES PREVIEW
	//
	const [filesPreviewObj, setFilesPreviewObj] = useState<FilesPreviewObject>({})

	useEffect(() => {
		setFilesPreviewObj({})
	}, [p.files])


	const askFilesPreview = (filesPath: string[]) => {
		if (!api) return

		// CACHING : do not ask again if file already has been fetched
		let newFilesPathArr: string[] = []
		for (let i = 0; i < filesPath.length; i++) {
			const path = filesPath[i];
			if (!filesPreviewObj[path]) newFilesPathArr.push(path)
		}

		// ask and fetch previews
		if (newFilesPathArr.length > 1) {
			api.files.getPreviews(newFilesPathArr, previews => {
				each(previews, preview => { filesPreviewObj[preview.path] = preview })
				setFilesPreviewObj(filesPreviewObj)
			})
		}

	}


	//
	// SORTING LOGIC
	//
	const cSortMode = api ? api.userSettings.get('ui_filesList_sortMode') : 2
	const onSortChange = () => {
		if (!api) return
		let newMode = cSortMode + 1 >= SortModes.length ? 0 : cSortMode + 1
		api.userSettings.set('ui_filesList_sortMode', newMode)
		p.onSortFiles(sortFiles(p.files, newMode))
	}

	return (//jsx
		<div className="files-list-component">
			<div className='list-toolbar'>
				<button
					type="button"
					title='sort'
					onClick={onSortChange}
				>
					<span>
						{p.files.length > 0 &&
							<span className='list-count'>({p.files.length})</span>
						}
						{SortModesLabels[cSortMode]}
					</span>
					<Icon name="faSort" color={cssVars.colors.l2.text} />
				</button>
			</div>
			{
				// LIST
			}
			<div
				className="list-wrapper"
			>
				<List
					files={p.files}
					filesPreview={filesPreviewObj}
					hoverMode={false}
					activeFileIndex={p.activeFileIndex}
					sortMode={cSortMode}
					onFileClicked={(fileIndex) => {
						p.onFileClicked(fileIndex)
					}}
					onFileDragStart={p.onFileDragStart}
					onFileDragEnd={p.onFileDragEnd}
					onVisibleItemsChange={visibleFilesPath => {
						askFilesPreview(visibleFilesPath)
					}}
				/>
			</div>
		</div>
	)//jsx
}
