import { pathToIfile } from "../../../../shared/helpers/filename.helper";
import { regexs } from "../../../../shared/helpers/regexs.helper";
import { iFile } from "../../../../shared/types.shared";
import { mem } from "../reactRenderer.manager";
import { ssrFn } from "../ssr.manager";
import { ssrGenCtag, ssrToggleCtag } from "../ssr/ctag.ssr";
import { safeString } from "../string.manager";
import { cssVars } from "../style/vars.style.manager";
import { genericReplacementPlugin } from "./replacements.cm";

///////////////////////////////////
// CTAG
//
const generateHtmlCtagInt = (matchs:string[], cFile:iFile):string => {
	let tagName = matchs[2].replaceAll("[[","").replaceAll("]]","")

	// style

	// opening button logic
	const openCtagFn = (el) => {
		if (!el) return
		let filepath = el.dataset.filepath
		let file = pathToIfile(filepath)
		//ssrToggleCtag(ssrIframeEl, ssrGenCtag(tagName, ""))
		let reactComp = ssrGenCtag(tagName, "", {file})
		let iframeEl = el.parentNode.parentNode.querySelector('.iframe-wrapper-cm-ctag')
		ssrToggleCtag(iframeEl, reactComp)	
	}

	// on click on x, open in iframe
	let buttonHtml = `
	<div class="button-ctag-cm-toggle" 
		onclick="${ssrFn("open-win-link", openCtagFn)}"
		data-filepath="${cFile.path}"
	>[x]</div>`
	let labelHtml = `<div class="cm-ctag-name">[[ ${tagName} ]]</div>`
	let overviewHtml = `<div class="cm-ctag-overview">${labelHtml}${buttonHtml}</div>`
	let iframeWrapperHtml = `<div class="iframe-wrapper-cm-ctag"></div>`

	let html = `<div class="cm-ctag-wrapper">${overviewHtml}${iframeWrapperHtml}</div>`

	return html
}
export const generateHtmlCtag = mem((matchs, cFile) => generateHtmlCtagInt(matchs, cFile))

export const addToDocumentStorageNode = () => {
	let getStorageWrapper = () => document.body.querySelector("#storage-wrapper")
	if (!getStorageWrapper()) {
		let div = document.createElement("div");
		div.id = "storageWrapper"
		document.body.appendChild(div)
	}
	// setTimeout(() => {
		// console.log(666, getStorageWrapper())
	// })
}

export const ctagPreviewPlugin = (cFile: iFile, cacheNodeId:string|null) => genericReplacementPlugin({
	pattern: regexs.userCustomTagFull2,
	replacement: matchs => {
		let tagName = matchs[2].replaceAll("[[","").replaceAll("]]","")
		// let idOverlay = `id_cm_replacement_div_${cFile.path}-${tagName}`
		// let boxBgHtml = `<div id="${idOverlay}" class="anchor-link-cm">${idOverlay}</div>`
		// idOverlay = safeString(idOverlay)
		let resEl = document.createElement("span");
		// resEl.innerHTML = boxBgHtml;
		// addToDocumentStorageNode()
		return resEl
	}
})

export const ctagPreviewPluginCss = () => {
	return `
	.cm-ctag-wrapper {
		background: #e9e9e9;
		padding: 8px;
		border-radius: 5px;
		.cm-ctag-overview {
			display: flex;
			.cm-ctag-name {
				font-weight: bold;
				color: ${cssVars.colors.main};
			}
			.button-ctag-cm-toggle {
	
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


// export const filePreviewPlugin = (cFile: iFile) => genericReplacementPlugin({
// 	pattern: regexs.ressource,
// 	replacement: matchs => {
// 		let resEl = document.createElement("span");
// 		resEl.innerHTML = compoHtml(matchs, cFile)
// 		return resEl
// 	}
// })
