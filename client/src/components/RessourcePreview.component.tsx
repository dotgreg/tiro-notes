import { each, random } from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import { cleanPath, pathToIfile } from '../../../shared/helpers/filename.helper';
import { iFile } from '../../../shared/types.shared';
import { getUrlTokenParam } from '../hooks/app/loginToken.hook';
import { deviceType } from '../managers/device.manager';
import { getFileType } from '../managers/file.manager';
import { atSsrStartupCheckIfOpen, setSsrStatus, ssrCachedStatus, ssrFn, ssrIcon } from '../managers/ssr.manager';
import { ssrGenCtag, ssrToggleCtag } from '../managers/ssr/ctag.ssr';
import { safeString } from '../managers/string.manager';
import { cssVars } from '../managers/style/vars.style.manager';
import { absoluteLinkPathRoot } from '../managers/textProcessor.manager';
import { getApi } from '../hooks/api/api.hook';


//
// Most of the logic here is not react but SSR, direct js binding
//

const heightIframe = {
	big: 400,
	small: 200
}

export const RessourcePreview = (p: {
	markdownTag: string
	file: iFile
	windowId: string
}) => {


	const canBePreviewed = (urlLink:string):{status:boolean, onlinePreviewLink?:string} => {
		let res = {status:false}
		let canBePreviewed = false
		let previewFormats = ["pdf", "mp4", "mp3", "ogg", "wav", "aac", "webm", "flac", "txt", "json", "css", "js", "html", "epub"]
		if (previewFormats.includes(getFileType(urlLink).toLowerCase())) canBePreviewed = true
		// for doc/docx/xls/xlsx/ppt/pptx + if window.location is not ip OR localhost, open it with google preview
		let cOrigin = window.location.origin
		let onlinePreviewFormats = ["ppt", "pptx", "doc", "docx", "xls", "xlsx"]
		let canBePreviewedOnline = onlinePreviewFormats.includes(getFileType(urlLink).toLowerCase())
		let localOrigins = ["localhost", "192.168"]
		let isLocal = inArray(cOrigin, localOrigins)
		if (!isLocal && canBePreviewedOnline) previewLink = `https://docs.google.com/gview?url=${ressLink}&embedded=true`
		let shouldBeOnlineToView = isLocal && canBePreviewedOnline
		let header = shouldBeOnlineToView ? `[REQUIRES NON LOCAL TIRO URL] ` : ''
		return res
	}


	const link = p.markdownTag.split('](')[1].slice(0, -1);
	const name = p.markdownTag.split('](')[0].replace('![', '');
	// let t1 = link.split('.');
	// let filetype = t1[t1.length - 1];
	// if (filetype === '7z') filetype = 'd7z';
	const ressLink = `${absoluteLinkPathRoot(p.file.folder)}/${link}${getUrlTokenParam()}`
	let downloadName = `${name}.${getFileType(link)}`
	let previewLink = cleanPath(ressLink) 

	

	// if cache opened
	let ssrId = `ress-${safeString(previewLink)}`
	atSsrStartupCheckIfOpen(p.file, previewLink, () => {
		let el = document.querySelector(`.${ssrId} .iframe-wrapper`)
		if (!el) return
		ssrToggleLogic(previewLink, el, p.file.path)
	})

	let i = ssrIcon
	const ssrToggleLogic = (
		ssrPreviewPath: string, 
		ssrIframeEl: any, 
		ssrFilePath:string, 
		opts?: {
			fullscreen?: boolean,
			openOnly?: boolean,
			persist?: boolean
		}
	) => {
		let fullscreen = opts?.fullscreen || false
		let fullscreenCloseEverything =  opts?.fullscreen || false
		if (!ssrIframeEl) return
		let file = pathToIfile(ssrFilePath)
		
		if ( opts?.persist) {
			let nStatus: ssrCachedStatus = !ssrIframeEl.querySelector(`iframe`) ? "open" : "closed"
			setSsrStatus(file, ssrPreviewPath, nStatus) 
		}
		const onFullscreenClose = () => {
			ssrIframeEl.innerHTML = ""
		}

		// if (isLocal && canBePreviewedOnline) return
		if (getFileType(ssrPreviewPath).toLocaleLowerCase() === "epub") {
			ssrToggleCtag(ssrIframeEl, ssrGenCtag("epub", ssrPreviewPath, p.windowId, {file, fullscreen, onFullscreenClose}), opts?.openOnly)
		} else if (getFileType(ssrPreviewPath).toLocaleLowerCase() === "pdf") {
			ssrToggleCtag(ssrIframeEl, ssrGenCtag("pdf", ssrPreviewPath, p.windowId, {file, fullscreen, onFullscreenClose}), opts?.openOnly)
		} else {
			ssrToggleCtag(ssrIframeEl, ssrGenCtag("iframe", ssrPreviewPath, p.windowId, { fullscreen, onFullscreenClose}))
		}
	}

	// 1 OPEN NEW WINDOW
	const openWinFn = (el) => {
		if (!el) return
		let link = el.dataset.link
		window.open(link, `popup-preview-link`, 'width=800,height=1000')
	}
	let openWindow = `<li title="Open link in detached window"
		onclick="${ssrFn("open-win-ress", openWinFn)}"
		data-link="${previewLink}">${i('up-right-from-square')}</li>`

	// 2 detach window
	const getIframeEl = (el) => el.parentNode.parentNode.parentNode.parentNode.parentNode.querySelector(".iframe-wrapper")
	const ssrPreviewFn = (el, opts?:{persist?: boolean, fullscreen?: boolean}) => {
		if (!el) return
		let ssrPreviewPath = el.dataset.link
		let ssrFilePath = el.dataset.filepath
		let elIframe = getIframeEl(el)
		ssrToggleLogic(ssrPreviewPath, elIframe, ssrFilePath, opts)
	}

	const ssrDetachWindowFn = (el) => {
		if (!el) return
		let ssrPreviewPath = el.dataset.link
		// let ssrFilePath = el.dataset.filepath
		// console.log(ssrPreviewPath, ssrFilePath)
		// let elIframe = getIframeEl(el)
		// ssrToggleLogic(ssrPreviewPath, elIframe, ssrFilePath)
		let ctagType = "iframe"
		const ext = getFileType(ssrPreviewPath).toLocaleLowerCase()
		if (ext === "epub") ctagType = "epub"
		if (ext === "pdf") ctagType = "pdf"

		getApi(api => {
			api.ui.floatingPanel.create({
				type: "ctag",
				layout: "full-center",
				ctagConfig: {
					tagName: ctagType,
					content: ssrPreviewPath,
				},
			})
		})
	}
	const previewPersistFn = el => {return ssrPreviewFn(el, {persist: true})}
	// const previewFullscreenFn = el => {return ssrPreviewFn(el,  {fullscreen: true})}
	// const detachCtag = el => {
	// 	return ssrPreviewFn(el,  {fullscreen: true})
	// }
	let preview = `<li
		onclick="${ssrFn("preview-link-ress", previewPersistFn)}"
		title="Toggle a pinned preview" 
		data-filepath="${p.file.path}" 
		data-link="${previewLink}">${i('thumbtack')}</li>`

	// 3 DOWNLOAD
	let downloadFn = (el) => {
		// console.log(ressLink, downloadName);
		downloadFile(downloadName, ressLink)
	}
	let download = `<li
		onclick="${ssrFn("download-link-ress", downloadFn)}"
		title="Preview link" data-filepath="${p.file.path}" data-link="${previewLink}">${i('download')}</li>`

	let buttonsHtml = `<ul>${preview} ${openWindow} ${download}</ul>`

	let mainLinkHtml = `<div 
		class="ressource-link-label" 
		data-filepath="${p.file.path}"  
		data-link="${previewLink}" 
		onclick="${ssrFn("click-ress-main-action", ssrDetachWindowFn)}">
			${name} (${getFileType(previewLink)})
		</div>`.split("\n").join("")

	return (
		<div className={`${ssrId} resource-link-iframe-wrapper`}>
			<div className={` resource-link-wrapper device-${deviceType()}`}>
				<div className={`resource-link-icon ${getFileType(previewLink)}`}></div>
				<div className={`resource-link-content-wrapper`}>



					<div dangerouslySetInnerHTML={{ __html: mainLinkHtml }}></div>

					<div
						dangerouslySetInnerHTML={{ __html: buttonsHtml }}
						className="buttons-wrapper">
					</div>
				</div>

			</div>
			<div className="iframe-wrapper"></div>
		</div >
	)
}
//  {type: 'tag', tagName: 'pdf', content: ' wwwwww ', start: 2, end: 3}

let w = '.resource-link-icon'
export const ressourcePreviewSimpleCss = () => `
.loading-string {
    text-align: center;
    padding: 50px;
}
.ressource-link-label {
		font-weight: bold;
		cursor: pointer;
}
.resource-link-ctag {
		// height: ${heightIframe.big - 21}px;
		min-height: 120px;
		overflow:hidden;
		width: 100%;
		border:none;
}
.resource-link-iframe {
		border: none;
		width: 100%;
}

.resource-link-wrapper,
.resource-link-wrapper a {
		color: ${cssVars.colors.main};
}
.resource-link-iframe-wrapper {
		background: #f7f6f6;
		border-radius: 5px;
		overflow:hidden;
}
.preview-area-wrapper .resource-link-iframe-wrapper {
		margin-top: 3px;
		background:#eee!important;
}

.resource-link-wrapper {
		padding: 7px;
		border-radius: 10px;
		position: relative;
		margin: 5px 0px;
}

.buttons-wrapper  {
		position: relative;
		top: -10px;
		height: 10px;
}
.resource-link-content-wrapper .ssr-icon {
		padding: 3px;
		font-size: 13px;
		margin: 0px 5px 0px 0px;
		color: #b9b9b9;
		cursor: pointer;
}
.resource-link-content-wrapper .ssr-icon:hover {
		color:grey;
}

.mdpreview-source {
		// display:none!important;
}

.resource-link-icon {
		top: 10px;
		left: 19px;
		width: 12px;
		height: 27px;
		display: inline-block;
		background-image: url(/static/media/file-solid.6415173e.svg);
		opacity: 0.08;
		position: absolute;
		background-repeat: no-repeat;
		transform: scale(1.5);
		background-image: url(${cssVars.assets.fileIcon});
}

${w}.epub, ${w}.cbr, ${w}.cbz,${w}.mobi, ${w}.azw, ${w}.azw3, ${w}.iba {background-image: url(${cssVars.assets.bookIcon}); }
${w}.pdf
{background-image: url(${cssVars.assets.pdfIcon}); }

${w}.xls, ${w}.xlsm, ${w}.xlsx, ${w}.ods
{background-image: url(${cssVars.assets.excelIcon}); }

${w}.avi, ${w}.flv, ${w}.h264, ${w}.m4v, ${w}.mov, ${w}.mp4, ${w}.mpg, ${w}.mpeg, ${w}.rm, ${w}.swf, ${w}.vob, ${w}.wmv, ${w}.mkv
{background-image: url(${cssVars.assets.videoIcon}); }

${w}.d7z, ${w}.arj, ${w}.deb, ${w}.rar, ${w}.gz, ${w}.zip, ${w}.rpm, ${w}.pkg
{background-image: url(${cssVars.assets.archiveIcon});}

${w}.aif, ${w}.mp3, ${w}.cda, ${w}.mid, ${w}.mpa, ${w}.ogg, ${w}.wav, ${w}.wpl, ${w}.wma, ${w}.midi
{background-image: url(${cssVars.assets.audioIcon}); }

${w}.doc, ${w}.docx, ${w}.odt, ${w}.txt
{background-image: url(${cssVars.assets.wordIcon}); }

${w}.html, ${w}.css, ${w}.js, ${w}.json, ${w}.ts, ${w}.jsx, ${w}.tsx
{background-image: url(${cssVars.assets.codeIcon}); }

${w}.bin, ${w}.dmg, ${w}.iso, ${w}.toast, ${w}.vcd
{
		top: 19px;
		transform: scale(1.8);
		background-image: url(${cssVars.assets.diskIcon});
}

${w}.ppt, ${w}.pptx, ${w}.odp, ${w}.key, ${w}.pps
{background-image: url(${cssVars.assets.presIcon}); }


.resource-link-content-wrapper {
		display: flex;
		justify-content: space-between;
}

.resource-link-content-wrapper {
}

.resource-link-content-wrapper ul  {
		padding-left: 7px;
		display: flex;
}
.resource-link-content-wrapper ul li {
		list-style: none;
		padding-left: 0px;
}
.resource-link-content-wrapper ul li:before {
		display: none;
}


// HIDING IT ON DESKTOP 
// .device-desktop .resource-link-wrapper:hover .resource-link-content-wrapper ul {
// 		opacity:1;
// 		width: 90px;
// 		// margin-top: 15px;
// 		pointer-events: all;
// }
// .device-desktop .resource-link-content-wrapper ul  {
// 		opacity: 0;
// 		width: 0px;
// 		transition: 0.2s all;
// 		transition-delay: 0.2s, 0s;
// 		pointer-events: none;
// }
.device-desktop .resource-link-wrapper .resource-link-content-wrapper ul {
		opacity:1;
		width: 90px;
		pointer-events: all;
}

`

const downloadFile = (filename: string, url: string) => {
	// Create an invisible A element
	const a = document.createElement("a");
	a.style.display = "none";
	document.body.appendChild(a);
	a.href = url
	a.target = "_blank"
	a.setAttribute("download", filename);
	a.click();
	window.URL.revokeObjectURL(a.href);
	document.body.removeChild(a);
}

const inArray = (needle: string, haystack: string[]) => {
	let res = false
	each(haystack, el => {
		// console.log(el.includes(needle), el, needle);
		if (el.includes(needle)) res = true
		if (needle.includes(el)) res = true
	})
	return res;
}
