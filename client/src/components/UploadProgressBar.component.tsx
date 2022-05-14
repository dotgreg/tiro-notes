import React, { useEffect, useRef, useState } from "react"

export const UploadProgressBar = (p: {
	progress: number
}) => {
	// const progress = 50
	const progress = p.progress
	const canShow = (progress >= 0 && progress < 100)
	return (
		<>
			{canShow &&
				<div className="upload-progress-bar-wrapper">
					<div className="bg-fill" style={{ width: `${progress}%` }}></div>
					<div className="label" >{progress}% uploaded... </div>
				</div>
			}
		</>
	)
}

export const uploadProgressBarCss = () => `
.device-mobile {
		.upload-progress-bar-wrapper {
				bottom: 176px;
		}
}
.upload-progress-bar-wrapper {
		.label {
				position: relative;
		}
		.bg-fill {
				transition: 0.1s all;
				position:absolute;
				background: #077e00;
				height: 100%;
				top: 0px;
				left: 0px;
		}
		position:absolute;
		bottom: 0px;
		width: 100%;
		left: 0px;
		/* background: green; */
		background: #a0a0a0;
		color: white;
		text-align: center;
		z-index:3;
		font-size: 9px;
		padding: 5px;
}
`;
