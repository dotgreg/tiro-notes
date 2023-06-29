import React from "react";
import { renderToString } from "react-dom/server";
import { regexs } from "../../../../shared/helpers/regexs.helper";
import { iFile } from "../../../../shared/types.shared";
import { absoluteLinkPathRoot } from "../textProcessor.manager";
import { genericReplacementPlugin } from "./replacements.cm";
import { Icon } from "../../components/Icon.component";
import { getUrlTokenParam } from "../../hooks/app/loginToken.hook";
import { each, isString } from "lodash";
import { getApi } from "../../hooks/api/api.hook";
import { ssrFn, ssrOnClick } from "../ssr.manager";
import {findImagesFromContent } from "../images.manager";
import { pathToIfile } from "../../../../shared/helpers/filename.helper";
import { match } from "assert";


///////////////////////////////////
// FILES
//

const openLightBoxFn = (el) => {
	if (!el) return
	let filePath = el.dataset.filePath as string
	let imageSrc = el.dataset.src as string
	getApi(api => {
		api.file.getContent(filePath, txt => {
			// GET IMAGES URLS FROM CONTENT
			let images = findImagesFromContent(txt, pathToIfile(filePath))
			console.log(images)
			if (images.length < 1) return
			let srcs:string[] = []
			let startIndex = 0
			each(images, (im,i) => {
				if (im.url === imageSrc) startIndex = i
				srcs.push(im.url)
			})
			api.ui.lightbox.open(startIndex, srcs)
		})
	})
}

export const imagePreviewPlugin = (file: iFile, windowId:string) => genericReplacementPlugin({
	file,
	windowId,
	pattern: regexs.image,
	replacement: matchs => {
		let resEl = document.createElement("div");
		resEl.innerHTML = generateImagePreviewHtml(matchs[0], matchs[1], file, true)
		return resEl;
	}
})
 
export const generateImagePreviewHtml = (fullMd: string, relSrc:string, cFile:iFile, showSource: boolean = false):string => {
	let sourceHtml = showSource ?  `<div class="mdpreview-source">${fullMd}</div>` : ''
	let url = relSrc.startsWith("http") ? relSrc : `${absoluteLinkPathRoot(cFile.folder)}/${relSrc}${getUrlTokenParam()}`
	return `<div class="cm-mdpreview-wrapper image-wrapper"><div class="cm-mdpreview-image" data-file-path="${cFile.path}" data-src="${url}" onclick="${ssrFn("image-open-lightbox", openLightBoxFn)}"> <img onerror="this.style.display='none'" src="${url}" /></div></div>${sourceHtml}`
}



export const imagePreviewCss = () => `
.cm-mdpreview-wrapper.image-wrapper {
		.cm-mdpreview-image {
			cursor:pointer;
		}
		.mdpreview-source {
				line-height: initial;
		}
}

`
