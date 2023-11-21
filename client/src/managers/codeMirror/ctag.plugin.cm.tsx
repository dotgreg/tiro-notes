import { pathToIfile } from "../../../../shared/helpers/filename.helper";
import { regexs } from "../../../../shared/helpers/regexs.helper";
import { iFile } from "../../../../shared/types.shared";
import { atSsrStartupCheckIfOpen, setSsrStatus, ssrCachedStatus, ssrFn, ssrIcon } from "../ssr.manager";
import { ssrGenCtag, ssrToggleCtag } from "../ssr/ctag.ssr";
import { safeString } from "../string.manager";
import { cssVars } from "../style/vars.style.manager";
import { genericReplacementPlugin } from "./replacements.cm";

///////////////////////////////////
// CTAG
//
const generateHtmlCtagInt = (matchs:string[], cFile:iFile, windowId:string):string => {
	
	let tagName = matchs[2].replaceAll("[[","").replaceAll("]]","")
	let content = matchs[0].replaceAll(`[[${tagName}]]`,"")
	let genIdCtag = (tagName, content, path) => `${safeString(tagName,"")}-${safeString(content,"")}-${safeString(path,"")}`
	let idCtag = genIdCtag(tagName, content, cFile.path)

	// opening button logic
	const openCtagFn = (el) => {
		if (!el) return
		let ssrFilepath = el.dataset.filepath
		let ssrContent = decodeURIComponent(el.dataset.tagcontent)
		let ssrTagName = el.dataset.tagname
		let ssrWindowId = el.dataset.windowid
		let ssrIdCtag = genIdCtag(ssrTagName,ssrContent,ssrFilepath)

		let file = pathToIfile(ssrFilepath)
		let iframeEl = el.parentNode.parentNode.querySelector('.iframe-wrapper-cm-ctag')
		let nStatus: ssrCachedStatus = !iframeEl.querySelector(`iframe`) ? "open" : "closed"
		setSsrStatus(file, ssrIdCtag, nStatus) 
		let reactComp = ssrGenCtag(ssrTagName, ssrContent, ssrWindowId, {file})
		ssrToggleCtag(iframeEl, reactComp)	
	}
	

	// if cache opened
	let ssrId = `ress-${idCtag}`
	atSsrStartupCheckIfOpen(cFile, idCtag, () => {
		let iframeEl = document.querySelector(`.${ssrId} .iframe-wrapper-cm-ctag`)
		if (!iframeEl) return
		let reactComp = ssrGenCtag(tagName, content, windowId, {file:cFile})
		ssrToggleCtag(iframeEl, reactComp)	
	})

	// on click on x, open in iframe
	let buttonHtml = `
	<div class="button-ctag-cm-toggle" 
		onclick="${ssrFn("toggle-ctag-link", openCtagFn)}"
		data-filepath="${cFile.path}"
		data-windowid="${windowId}"
		data-tagname="${tagName}"
		data-tagcontent="${encodeURIComponent(content)}"
	>${ssrIcon('eye')}</div>`
	let labelHtml = `<div class="cm-ctag-name">[[ ${tagName} ]]</div>`
	let overviewHtml = `<div class="cm-ctag-overview">${labelHtml}${buttonHtml}</div>`
	let iframeWrapperHtml = `<div class="iframe-wrapper-cm-ctag"></div>`

	let html = `<div class="cm-ctag-wrapper ${ssrId}">${overviewHtml}${iframeWrapperHtml}</div>`

	return html
}


export const ctagPreviewPlugin = (file: iFile, windowId:string) => genericReplacementPlugin({
	file,
	windowId,
	pattern: regexs.userCustomTagFull2,
	replacement: matchs => {
		let resEl = document.createElement("span");
		resEl.innerHTML = generateHtmlCtagInt(matchs, file, windowId);
		return resEl
	}
})

export const ctagPreviewPluginCss = () => {
	return `
	.cm-ctag-wrapper {
		position:relative;
		background: #f2f2f2;
		padding: 8px;
		border-radius: 5px;
		.cm-ctag-overview {
			display: flex;
			.cm-ctag-name {
				font-weight: bold;
				color: ${cssVars.colors.main};
			}
			.button-ctag-cm-toggle {
				position: absolute;
				right: 0px;
				top: -1px;
				opacity: 0.5;
				cursor: pointer;
				padding: 10px;
				&:hover {
					opacity: 0.7;
				}
			}
		}
		.iframe-wrapper-cm-ctag {

		}
	}
	

	`
}

// let compoHtml = (matchs, cFile) => {
// 	let full = matchs[0]
// 	let sourceHtml = `<div class="mdpreview-source">${full}</div>`
// 	let compoHtml = renderToString(<RessourcePreview markdownTag={full} file={cFile} />)
// 	return `${compoHtml} ${sourceHtml}`;
// }


