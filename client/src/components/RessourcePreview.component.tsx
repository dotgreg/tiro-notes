import { each, random } from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import { generateUUID } from '../../../shared/helpers/id.helper';
import { iFile } from '../../../shared/types.shared';
import { getApi } from '../hooks/api/api.hook';
import { getUrlTokenParam } from '../hooks/app/loginToken.hook';
import { deviceType } from '../managers/device.manager';
import { ssrFn, ssrIcon, ssrOpenIframeEl2 } from '../managers/ssr.manager';
import { ssrToggleEpubCtag, ssrTogglePdfCtag } from '../managers/ssr/ctag.ssr';
import { cssVars } from '../managers/style/vars.style.manager';
import { absoluteLinkPathRoot } from '../managers/textProcessor.manager';


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
}) => {
	// console.log(34555555555, p.markdownTag, p.file);

	const link = p.markdownTag.split('](')[1].slice(0, -1);
	const name = p.markdownTag.split('](')[0].replace('![', '');
	let t1 = link.split('.');
	let filetype = t1[t1.length - 1];
	if (filetype === '7z') filetype = 'd7z';
	const ressLink = `${absoluteLinkPathRoot(p.file.folder)}/${link}${getUrlTokenParam()}`
	let downloadName = `${name}.${filetype}`

	// IF CAN BE PREVIEWED
	let canBePreviewed = false
	let previewFormats = ["pdf", "mp4", "mp3", "ogg", "wav", "aac", "webm", "flac", "txt", "json", "css", "js", "html", "epub"]
	if (previewFormats.includes(filetype.toLowerCase())) canBePreviewed = true
	// for doc/docx/xls/xlsx/ppt/pptx + if window.location is not ip OR localhost, open it with google preview
	let cOrigin = window.location.origin
	let onlinePreviewFormats = ["ppt", "pptx", "doc", "docx", "xls", "xlsx"]
	let canBePreviewedOnline = onlinePreviewFormats.includes(filetype.toLowerCase())
	let localOrigins = ["localhost", "192.168"]
	let isLocal = inArray(cOrigin, localOrigins)
	let previewLink = ressLink
	if (!isLocal && canBePreviewedOnline) previewLink = `https://docs.google.com/gview?url=${ressLink}&embedded=true`
	let shouldBeOnlineToView = isLocal && canBePreviewedOnline
	let header = shouldBeOnlineToView ? `[REQUIRES NON LOCAL TIRO URL] ` : ''

	//
	// JS PURE SSR LOGIC
	//
	//
	// CACHING
	//
	let cacheId = `ressource-preview-status-${p.file.path}`
	let idRess = `${p.file.path}-${link}`
	type cachedStatus = "open" | "closed"
	const setStatus = (status: cachedStatus) => {
		getApi(api => {
			api.cache.get(cacheId, res => {
				if (!res) res = {}
				res[idRess] = status
				// console.log(2, cacheId, res);
				api.cache.set(cacheId, res, -1)
			})
		})
	}
	const getStatus = (cb: (status: cachedStatus) => void) => {
		getApi(api => {
			api.cache.get(cacheId, res => {
				if (!res) return
				let r = res[idRess] ? res[idRess] : "closed"
				// console.log(1, { cacheId, r, res, residres: res[idRess] });
				cb(r)
			})
		})
	}

	// if cache opened
	let id = `ress-${generateUUID()}`


	const atStartupCheckIfOpen = () => {
		getStatus(r => {
			if (r === "open") {
				setTimeout(() => {
					let el = document.querySelector(`.${id} .iframe-wrapper`)
					if (!el) return
					previewLogic(el)
				}, 500)
			}
		})
	}
	atStartupCheckIfOpen()

	let i = ssrIcon

	const previewLogic = (iframeEl: any, opts?: {
		fullscreen?: boolean,
		shouldShow?: boolean,
		persist?: boolean
	}) => {
		let el = iframeEl
		let fullscreen = opts?.fullscreen || false
		let shouldShow = opts?.shouldShow || false
		let persist = opts?.persist || false
		if (!el) return
		let nStatus: any = !el.querySelector(`iframe`) ? "open" : "closed"
		persist && setStatus(nStatus)
		if (isLocal && canBePreviewedOnline) return
		if (filetype.toLocaleLowerCase() === "epub") {
			ssrToggleEpubCtag(el, previewLink, p.file, fullscreen, shouldShow)
		} else if (filetype.toLocaleLowerCase() === "pdf") {
			ssrTogglePdfCtag(el, previewLink, p.file, fullscreen, shouldShow)
		} else {
			ssrOpenIframeEl2(el, previewLink)
		}
	}

	// 1
	const openWinFn = (el) => {
		if (!el) return
		let link = el.dataset.link
		window.open(link, `popup-preview-link`, 'width=800,height=1000')
	}
	let openWindow = `<li title="Open link in detached window"
		onclick="${ssrFn("open-win-ress", openWinFn)}"
		data-link="${previewLink}">${i('up-right-from-square')}</li>`

	// 2
	const getIframeEl = (el) => el.parentNode.parentNode.parentNode.parentNode.parentNode.querySelector(".iframe-wrapper")

	const previewPersistFn = (el) => {
		if (!el) return
		el = getIframeEl(el)
		previewLogic(el, { persist: true })
	}
	const previewFullscreenFn = (el) => {
		if (!el) return
		// console.log(el.dataset);
		el = getIframeEl(el)
		previewLogic(el, { fullscreen: true, shouldShow: true })
	}

	let preview = `<li
		onclick="${ssrFn("preview-link-ress", previewPersistFn)}"
		title="Preview link" data-link="${previewLink}">${i('eye')}</li>`

	// 3
	let downloadFn = (el) => {
		// console.log(ressLink, downloadName);
		downloadFile(downloadName, ressLink)
	}
	let download = `<li
		onclick="${ssrFn("download-link-ress", downloadFn)}"
		title="Preview link" data-link="${previewLink}">${i('download')}</li>`

	let buttonsHtml = `<ul>${preview} ${openWindow} ${download}</ul>`

	let mainLinkHtml = `<div class="ressource-link-label" data-link="${previewLink}" onclick="${ssrFn("preview-link-ress-main", previewFullscreenFn)}">${name} (${filetype})</div>`

	// <a className="resource-link preview-link"
	// 					href={ressLink}
	// 					download
	// 				></a>
	return (
		<div className={`${id} resource-link-iframe-wrapper`}>
			<div className={` resource-link-wrapper device-${deviceType()}`}>
				<div className={`resource-link-icon ${filetype}`}></div>
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
		height: ${heightIframe.big - 21}px;
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
		display:none!important;
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
.device-desktop .resource-link-wrapper:hover .resource-link-content-wrapper ul {
		opacity:1;
		width: 90px;
		// margin-top: 15px;
		pointer-events: all;
}
.device-desktop .resource-link-content-wrapper ul  {
		opacity: 0;
		width: 0px;
		transition: 0.2s all;
		transition-delay: 0.2s, 0s;
		pointer-events: none;
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
