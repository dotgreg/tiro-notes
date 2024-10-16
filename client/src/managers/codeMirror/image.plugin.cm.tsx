import React from "react";
import { renderToString } from "react-dom/server";
import { regexs } from "../../../../shared/helpers/regexs.helper";
import { iFile } from "../../../../shared/types.shared";
import { absoluteLinkPathRoot } from "../textProcessor.manager";
import { genericReplacementPlugin } from "./replacements.cm";
import { Icon } from "../../components/Icon.component";
import { getUrlTokenParam } from "../../hooks/app/loginToken.hook";
import { each, isString } from "lodash-es";
import { getApi } from "../../hooks/api/api.hook";
import { ssrFn, ssrOnClick } from "../ssr.manager";
import {findImagesFromContent } from "../images.manager";
import { pathToIfile } from "../../../../shared/helpers/filename.helper";
import { match } from "assert";
import { userSettingsSync } from "../../hooks/useUserSettings.hook";
import { cleanUrl } from "../url.manager";


///////////////////////////////////
// FILES
//

const openLightBoxFn = (el) => {
	if (!el) return
	let filePath = el.dataset.filePath as string
	let imageSrc = el.dataset.src as string
	// console.log("openLightBoxFn", filePath, imageSrc)
	getApi(api => {
		api.file.getContent(filePath, txt => {
			// GET IMAGES URLS FROM CONTENT
			let images = findImagesFromContent(txt, pathToIfile(filePath))
			if (images.length < 1) return
			let srcs:string[] = []
			let startIndex = 0
			each(images, (im,i) => {
				if (cleanUrl(imageSrc).includes(cleanUrl(im.url))) startIndex = i
				srcs.push(im.url)
			})
			api.ui.lightbox.open(startIndex, srcs)
		})
	})
}

export const imagePreviewPlugin = (file: iFile, windowId:string) => genericReplacementPlugin({
	file,
	windowId,
	pattern: regexs.image2,
	replacement: params => {
		const matchs = params.matchs
		let resEl = document.createElement("div");
		resEl.innerHTML = generateImagePreviewHtml2(matchs[0], matchs[2], matchs[1], matchs[5], file)
		return resEl;
	}
})

export const generateImagePreviewHtml2 = (fullMd: string, relSrc:string, caption:string, rawConfig:string, cFile:iFile):string => {
	if (caption !== "image") caption = `<div class="mdpreview-source">${caption}</div>`
	if (!userSettingsSync.curr.ui_editor_show_image_title) caption = ``

	let url = relSrc.startsWith("http") ? relSrc : `${absoluteLinkPathRoot(cFile.folder)}/${relSrc}${getUrlTokenParam()}`
	url = cleanUrl(url)
	if (!rawConfig) rawConfig = ""
	let cnf = rawConfig.trim().split("=")
	let styleStr = ``
	if (cnf[0] === "width" || cnf[0] ==="height") {
		let otherProp = cnf[0] === "width" ? "height:auto;max-height:none" : "width:auto; max-width:none;"
		styleStr =`style="${cnf[0]}:${cnf[1]}; ${otherProp}"`
	}
	url = cleanUrl(url)
	return `<div class="cm-mdpreview-wrapper image-wrapper"><div class="cm-mdpreview-image" data-file-path="${cFile.path}" data-src="${url}" onclick="${ssrFn("image-open-lightbox", openLightBoxFn)}"> <img ${styleStr} src="${url}" /></div></div>${caption}`

}

// export const generateImagePreviewHtml = generateImagePreviewHtml2
 
export const generateImagePreviewHtml = (fullMd: string, relSrc:string, cFile:iFile, showSource: boolean = false):string => {
	// let sourceHtml = showSource ?  `<div class="mdpreview-source">${fullMd}</div>` : ''
	// sourceHtml = `<div class="mdpreview-source">${fullMd}</div>` 
	let sourceHtml = ""
	let caption = fullMd.split("[")[1].split("]")[0]
	if (caption !== "image") sourceHtml = `<div class="mdpreview-source">${caption}</div>`
	if (!userSettingsSync.curr.ui_editor_show_image_title) sourceHtml = ``

	let url = relSrc.startsWith("http") ? relSrc : `${absoluteLinkPathRoot(cFile.folder)}/${relSrc}${getUrlTokenParam()}`
	url = cleanUrl(url)
	return `<div class="cm-mdpreview-wrapper image-wrapper"><div class="cm-mdpreview-image" data-file-path="${cFile.path}" data-src="${url}" onclick="${ssrFn("image-open-lightbox", openLightBoxFn)}"> <img src="${url}" /></div></div>${sourceHtml}`
}



export const imagePreviewCss = () => `
.cm-mdpreview-wrapper.image-wrapper {
		// display: inline;
		min-width: 10px;
		min-height: 10px;
		div {
			// display: inline;
		}
		img {
			
		}
		.cm-mdpreview-image {
			// background: #ffe4e4;
			min-width: 50px;
			min-height: 30px;
			cursor:pointer;
		}
		.mdpreview-source {
				line-height: initial;
		}
}

`
