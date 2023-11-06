import { each, uniqueId } from "lodash"
import React, { useContext, useEffect, useRef, useState } from "react"
import { iFile } from "../../../shared/types.shared"
import { ClientApiContext, getApi } from "../hooks/api/api.hook"
import { onUploadProgressFn, onUploadSuccessFn } from "../hooks/api/upload.api.hook"
import { cssVars } from "../managers/style/vars.style.manager"
import { Icon } from "./Icon.component"
import { uploadFileToEditor } from "../managers/upload.manager"

export type iUploadType = 'all' | 'image' | 'camera' | 'microphone'

export const UploadButton = (p: {
	onProgress?: onUploadProgressFn
	onSuccess?: onUploadSuccessFn
	file: iFile
	type: iUploadType
	label: string
	windowId: string
}) => {
	let icon = "faPaperclip"
	if (p.type === "image") icon = "faImage"
	if (p.type === "camera") icon = "faCamera"
	if (p.type === "microphone") icon = "faMicrophone"

	let accept = "*"
	if (p.type === "image") accept = "image/*"
	if (p.type === "camera") accept = "image/*"
	if (p.type === "microphone") accept = "audio/*"

	const id = uniqueId()

	return (
		<div className="upload-button-component">
			<input
				className='input-file-hidden'
				id={`file-${id}`}
				multiple
				name={`file-${id}`}
				type="file"
				capture={p.type === "camera" || p.type === "microphone"}
				accept={accept}
				onChange={(e: any) => {
					const files = e.target.files as File[]
					if (files.length === 0) return
					each(files, file => {
						// alert(JSON.stringify(file));
						uploadFileToEditor({fileToUpload: file, folder:p.file.folder, windowId:p.windowId})
						// getApi(api => {
						// 	api.upload.uploadFile({
						// 		file,
						// 		folderPath: p.file.folder,
						// 		onProgress: p.onProgress,
						// 		onSuccess: p.onSuccess
						// 	})
						// })
					})
				}}
			/>
			<label htmlFor={`file-${id}`}>
				<Icon name={icon} />
				<span className="label-text">{p.label}</span>
			</label>
		</div>
	)
}

export const uploadButtonCss = () => `
.upload-button-wrapper {
		width: 100%;
		cursor: pointer;
		.inside-html-wrapper {
				width: 100%;
		}
		&:hover {
				.label-text { color :${cssVars.colors.main}; }
		}
		.upload-button-component {
				cursor: pointer;
				display: flex;
				position: relative;
				width: 100%;
				.input-file-hidden {
						width: 0.1px;
						height: 0.1px;
						opacity: 0;
						overflow: hidden;
						position: absolute;
						z-index: -1;
				}
				.label-text {
						cursor: pointer;
						margin-left: 18px;
						font-size: 11px;
						font-weight: 400;
				}
		}
}
`
