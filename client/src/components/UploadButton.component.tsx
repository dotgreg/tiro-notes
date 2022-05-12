import { each } from "lodash"
import React, { useContext, useEffect, useRef, useState } from "react"
import { iFile } from "../../../shared/types.shared"
import { ClientApiContext } from "../hooks/api/api.hook"
import { onUploadProgressFn, onUploadSuccessFn } from "../hooks/api/upload.api.hook"
import { cssVars } from "../managers/style/vars.style.manager"
import { Icon } from "./Icon.component"

export const UploadButton = (p: {
	onProgress: onUploadProgressFn
	onSuccess: onUploadSuccessFn
	file: iFile
}) => {

	const api = useContext(ClientApiContext);

	return (
		<div className="upload-button-component">
			<input
				className='input-file-hidden'
				id="file"
				multiple
				name="file"
				type="file"
				onChange={(e: any) => {
					const files = e.target.files as File[]
					if (files.length === 0) return
					each(files, file => {
						api && api.upload.uploadFile({
							file,
							folderPath: p.file.folder,
							onProgress: p.onProgress,
							onSuccess: p.onSuccess
						})
					})
				}}
			/>
			{/* @ts-ignore  */}
			<label for="file">
				<Icon name="faPaperclip" />
				<span className="label-text">Upload files </span>
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
								margin-left: 18px;
								font-size: 10px;
								font-weight: 400;
						}
					}
				}
				`
