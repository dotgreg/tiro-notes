import { each } from "lodash"
import React, { useRef, useState } from "react"
import { iFile } from "../../../shared/types.shared"
import { getClientApi } from "../managers/api/api.manager"
import { onUploadProgressFn, onUploadSuccessFn } from "../managers/api/upload.api.manager"
import { Icon } from "./Icon.component"

export const UploadButton = (p: {
	onProgress: onUploadProgressFn
	onSuccess: onUploadSuccessFn
	file: iFile
}) => {
	return (
		<>
			<input
				className='input-file-hidden'
				id="file"
				multiple
				name="file"
				type="file"
				onChange={(e: any) => {
					const files = e.target.files as File[]
					if (files.length === 0) return
					getClientApi().then(api => {
						each(files, file => {
							api.upload.uploadFile({
								file,
								folderPath: p.file.folder,
								onProgress: p.onProgress,
								onSuccess: p.onSuccess
							})
						})
					})
				}}
			/>
				{/* @ts-ignore  */}
			<label for="file">
				<Icon name="faPaperclip" />
			</label>
		</>
	)
}

export const uploadButtonCss = `
				.upload-button-wrapper {
					position: relative;
				.input-file-hidden {
					width: 0.1px;
				height: 0.1px;
				opacity: 0;
				overflow: hidden;
				position: absolute;
				z-index: -1;
        }
      }
				`;
