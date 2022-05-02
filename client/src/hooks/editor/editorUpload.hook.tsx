import React, { useRef, useState } from "react"
import { Icon } from "../../components/Icon.component"
import { configClient } from "../../config"
import { getClientApi } from "../../managers/api/api.manager"
import { initClipboardListener } from "../../managers/clipboard.manager"
import { clientSocket2 } from "../../managers/sockets/socket.manager"
import { safeString } from "../../managers/string.manager"
import { cssVars } from "../../managers/style/vars.style.manager"
import { listenOnUploadSuccess, uploadFile, initListenUploadOnDrop, uploadOnInputChange } from "../../managers/upload.manager"
import { getLoginToken } from "../app/loginToken.hook"
import { useDebounce } from "../lodash.hooks"
import { useStatMemo } from "../useStatMemo.hook"

let keyUploadSocketListener

export const useEditorUploadLogic = (p: {
	onUploadSuccess: (ressourceInMd: string) => void
}) => {
	const [dragzoneEnabled, setDragzoneEnabled] = useState(false)
	const [uploadProgress, setUploadProgress] = useState(``)
	let uploadDragzoneRef = useRef<HTMLDivElement>(null)
	let uploadInputRef = useRef<HTMLInputElement>(null)

	const reinitUploadLogic = () => {
		console.log(`[UPLOAD] 005666 cleanUploadLogic`);
		clientSocket2.off(keyUploadSocketListener)

		// WHEN RECEIVE FILE INFOS FROM API
		console.log(`[UPLOAD] 005666 initUploadLogic`);

		keyUploadSocketListener = listenOnUploadSuccess((file) => {
			let ressourceInMd = `![${safeString(file.name)}](${file.path})\n\n`
			p.onUploadSuccess(ressourceInMd)
		})

		// UPLOAD FROM CLIPBOARD
		initClipboardListener({
			onImagePasted: (imageBlob) => {
				uploadFile(imageBlob, onUploadProgressAction)
			}
		})

		// UPLOAD FROM INPUT
		uploadInputRef.current ? uploadOnInputChange(uploadInputRef.current, onUploadProgressAction) : console.error('[UPLOAD] 005666 uploadInputRef not detected');

		// UPLOAD FROM DRAG DROP
		if (uploadDragzoneRef.current) {
			initListenUploadOnDrop({
				onDragEnd: () => { setDragzoneEnabled(false) },
				onDragStart: () => { setDragzoneEnabled(true) },
				onProgress: onUploadProgressAction
			})
		}
	}
	const onUploadProgressAction = (nb: number) => {
		setUploadProgress(`${nb}% uploaded`)
		if (nb === 100) setUploadProgress('');
	}

	const updateUploadFolder = (newUploadFolder: string) => {
		console.log(`[UPLOAD] 005666 updateUploadFolder to ${newUploadFolder}`);
		debouncedUploadResourcesInfos(newUploadFolder)
	}
	const debouncedUploadResourcesInfos = useDebounce((newUploadFolder) => {
		clientSocket2.emit('uploadResourcesInfos', { folderpath: newUploadFolder, token: getLoginToken() })
	}, 3000)

	const uploadButtonConfig = {
		title: 'upload files',
		class: 'upload-button-wrapper',
		action: () => { },
		customHtml: <>
			<input
				className='input-file-hidden'
				id="file"
				multiple
				name="file"
				type="file"
				onChange={(e: any) => {
					console.log(
						555,
						e,
						e.target.files,
						e.dataTransfer,
					);
					const f = e.target.files[0]
					getClientApi().then(api => {
						api.upload.uploadFile({
							file: f,
							folderPath: '.',
							onProgress: p => { console.log(222, p); },
							onSuccess: p => { console.log(2223, p); }
						})
					})
				}}
			/>
			{/* @ts-ignore  */}
			<label for="file"
			><Icon name="faPaperclip" /></label>
		</>
	}


	// COMPONENTS
	const UploadDragZone = useStatMemo(<div
		className={`dragzone ${dragzoneEnabled ? '' : 'hidden'}`}
		ref={uploadDragzoneRef} >
	</div>, [dragzoneEnabled])

	// COMPONENTS
	const UploadProgress = useStatMemo(<div
		className={`dragzone ${dragzoneEnabled ? '' : 'hidden'}`}
		ref={uploadDragzoneRef} >
	</div>, [dragzoneEnabled])

	return {
		reinitUploadLogic, updateUploadFolder,
		uploadButtonConfig,
		UploadDragZone,
		uploadProgress
	}
}

export const DragzoneCss = `
    .dragzone {
        &.hidden {
        display:none;
        }
        display:block;
        position: absolute;
        top: 3vh;
        left: 3vw;
        width: 94vw;
        height: 94vh;
        z-index: 10;
        background: rgba(255,255,255,0.4);
    }

.upload-progress {
    position: fixed;
    left: 0px;
    width: 100%;
    z-index: 100;
    background: ${cssVars.colors.green};
    padding: 2px;
    text-align: center;
    border-radius: 0px 0px 6px 6px;
    color: white;
    bottom: 0px;
    opacity: 1;
}
`
