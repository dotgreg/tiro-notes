import { each, random } from 'lodash';
import React, { useState } from 'react';
import { generateUUID } from '../../../shared/helpers/id.helper';
import { iFile } from '../../../shared/types.shared';
import { getApi } from '../hooks/api/api.hook';
import { getUrlTokenParam } from '../hooks/app/loginToken.hook';
import { deviceType } from '../managers/device.manager';
import { renderReactToId } from '../managers/reactRenderer.manager';
import { cssVars } from '../managers/style/vars.style.manager';
import { absoluteLinkPathRoot } from '../managers/textProcessor.manager';
import { ButtonsToolbar, iToolbarButton } from './ButtonsToolbar.component';
import { ContentBlock } from './ContentBlock.component';



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
	const [iframeOpen, setIframeOpen] = useState(false)

	const link = p.markdownTag.split('](')[1].slice(0, -1);
	const name = p.markdownTag.split('](')[0].replace('![', '');
	let t1 = link.split('.');
	let filetype = t1[t1.length - 1];
	if (filetype === '7z') filetype = 'd7z';
	const ressLink = `${absoluteLinkPathRoot(p.file.folder)}/${link}${getUrlTokenParam()}`
	let downloadName = `${name}.${filetype}`

	//
	// TOOLBAR BUTTONS
	//
	let buttons: iToolbarButton[] = [
		{
			title: 'Download',
			icon: 'faDownload',
			action: () => { console.log(ressLink, downloadName); downloadFile(downloadName, ressLink) }
		},
	]

	//
	// IF CAN BE PREVIEWED
	//
	let canBePreviewed = false
	let previewFormats = ["pdf", "mp4", "mp3", "ogg", "wav", "aac", "webm", "flac", "txt", "json", "css", "js", "html", "epub"]
	if (previewFormats.includes(filetype.toLowerCase())) canBePreviewed = true

	// for doc/docx/xls/xlsx/ppt/pptx + if window.location is not ip OR localhost, open it with google preview
	let cOrigin = window.location.origin
	let onlinePreviewFormats = ["ppt", "pptx", "doc", "docx", "xls", "xlsx"]
	let canBePreviewedOnline = onlinePreviewFormats.includes(filetype.toLowerCase())
	let bigIframe = canBePreviewedOnline || filetype.toLowerCase() === "pdf"
	let localOrigins = ["localhost", "192.168"]
	let isLocal = inArray(cOrigin, localOrigins)
	let previewLink = ressLink
	if (!isLocal && canBePreviewedOnline) previewLink = `https://docs.google.com/gview?url=${ressLink}&embedded=true`
	let shouldBeOnlineToView = isLocal && canBePreviewedOnline
	let header = shouldBeOnlineToView ? `[REQUIRES NON LOCAL TIRO URL] ` : ''

	if (canBePreviewed || canBePreviewedOnline) {
		buttons.unshift({
			title: header + 'Open in detached window',
			icon: 'faExternalLinkAlt',
			action: () => {
				if (isLocal && canBePreviewedOnline) return
				window.open(previewLink, `popup-${previewLink}`, 'width=800,height=1000')
			}
		})
		buttons.unshift({
			title: !iframeOpen ? header + 'Preview' : 'Close Preview',
			icon: !iframeOpen ? 'faEye' : 'faEyeSlash',
			action: () => {
				if (isLocal && canBePreviewedOnline) return
				setIframeOpen(!iframeOpen)
			}
		})
	}

	//
	// JS PURE SSR LOGIC
	//
	let elId = `id-${generateUUID()}`
	const ssrOnClick = (query: string, action: Function) => {
		let el = document.querySelector(query)
		el?.addEventListener("click", e => { action(e) })
	}
	const ssrOpenEpubCtag = () => {
		let elIframe = document.querySelector(`.${elId} .iframe-wrapper`)
		if (!elIframe) return
		let isIframeOpen = elIframe.querySelector(`iframe`)
		let idEl = renderReactToId(<ContentBlock
			file={p.file}
			block={{ type: 'tag', tagName: 'epub', content: previewLink, start: 0, end: 0 }}
			windowHeight={heightIframe.big + 75}

			windowId="null"
			yCnt={0}
			onIframeMouseWheel={() => { }}
		/>, { delay: 100 });
		let iframeHtml = `<div id="${idEl}" class="resource-link-ctag"><div class="loading-string">loading...</div></div>`
		elIframe.innerHTML = !isIframeOpen ? iframeHtml : ""
		setStatus(!isIframeOpen ? "open" : "closed")
	}

	const ssrOpenPdfCtag = () => {
		let elIframe = document.querySelector(`.${elId} .iframe-wrapper`)
		if (!elIframe) return
		let isIframeOpen = elIframe.querySelector(`iframe`)
		let idEl = renderReactToId(<ContentBlock
			file={p.file}
			block={{ type: 'tag', tagName: 'pdf', content: previewLink, start: 0, end: 0 }}
			windowHeight={heightIframe.big + 75}

			windowId="null"
			yCnt={0}
			onIframeMouseWheel={() => { }}
		/>, { delay: 100 });
		let iframeHtml = `<div id="${idEl}" class="resource-link-ctag"><div class="loading-string">loading...</div></div>`
		elIframe.innerHTML = !isIframeOpen ? iframeHtml : ""
		setStatus(!isIframeOpen ? "open" : "closed")
	}
	const ssrOpenIframe = () => {
		let elIframe = document.querySelector(`.${elId} .iframe-wrapper`)
		let isIframeOpen = elIframe?.querySelector(`iframe`)
		let height = bigIframe ? heightIframe.big : heightIframe.small
		let iframeHtml = `<iframe
																												src='${previewLink}'
																												title='${previewLink}'
																												allowFullScreen
																												class="resource-link-iframe"
																												style="height:${height}px"
																												/>`
		if (!elIframe) return
		elIframe.innerHTML = !isIframeOpen ? iframeHtml : ""
		setStatus(!isIframeOpen ? "open" : "closed")
	}



	const ssrOpenPreview = () => {
		if (isLocal && canBePreviewedOnline) return
		if (filetype.toLocaleLowerCase() === "epub") {

			getApi(api => {
				api.file.getContent("/.tiro/tags/epub.md", content => {
					ssrOpenEpubCtag()
				}, { onError: err => { } })
			})

		} else if (filetype.toLocaleLowerCase() === "pdf") {
			// if we detect the ctag pdf, replace preview iframe by ctag
			getApi(api => {
				api.file.getContent("/.tiro/tags/pdf.md", content => {
					ssrOpenPdfCtag()
				}, {
					onError: err => {
						ssrOpenIframe()
					}
				})
			})
		} else {
			ssrOpenIframe()
		}
	}


	let cacheId = `ressource-preview-status`
	let idRess = `${p.file.path}-${link}`
	type cachedStatus = "open" | "closed"
	const setStatus = (status: cachedStatus) => {
		getApi(api => {
			api.cache.get(cacheId, res => {
				if (!res) res = {}
				res[idRess] = status
				api.cache.set(cacheId, res, -1)
			})
		})
	}
	const getStatus = (cb: (status: cachedStatus) => void) => {
		getApi(api => {
			api.cache.get(cacheId, res => {
				if (!res) return
				let r = res[idRess] ? res[idRess] : "closed"
				cb(r)
			})
		})

	}





	// INIT SSR (server side rendering, no react)
	const ssrInitLogic = () => {
		setTimeout(() => {

			getStatus(status => {
				if (status === "open") ssrOpenPreview()
			})


			// ADD JS LOGIC TO BUTTONS
			let barPath = `.${elId} ul.buttons-toolbar-component`
			ssrOnClick(`${barPath} .btn-preview`, ssrOpenPreview)
			ssrOnClick(`${barPath} .btn-open`, () => {
				if (isLocal && canBePreviewedOnline) return
				window.open(previewLink, `popup-${previewLink}`, 'width=800,height=1000')
			})
			ssrOnClick(`${barPath} .btn-download`, () => {
				downloadFile(downloadName, ressLink)
			})
		}, 100)
	}
	ssrInitLogic()
	// console.log(downloadFile);
	console.log(555555555, p.file.name);

	return (
		<div className={`${elId} resource-link-iframe-wrapper`}>
			{random(0,100000000000000000)}
			<div className={` resource-link-wrapper device-${deviceType()}`}>
				<div className={`resource-link-icon ${filetype}`}></div>
				<div className={`resource-link-content-wrapper`}>
					<a className="resource-link preview-link"
						href={ressLink}
						download
					>
						{name} ({filetype})
					</a>

					<ButtonsToolbar
						popup={false}
						buttons={buttons}
						size={1}
					/>
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

.mdpreview-source {
	display:none!important;
}

.resource-link-icon {
		top: 14px;
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
}
.resource-link-content-wrapper ul li {
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
