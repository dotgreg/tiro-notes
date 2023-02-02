import React from "react";
import { renderToString } from "react-dom/server";
import { regexs } from "../../../../shared/helpers/regexs.helper";
import { iFile } from "../../../../shared/types.shared";
import { absoluteLinkPathRoot } from "../textProcessor.manager";
import { genericReplacementPlugin } from "./replacements.cm";
import { Icon } from "../../components/Icon.component";
import { getUrlTokenParam } from "../../hooks/app/loginToken.hook";
import { isString } from "lodash";
import { getApi } from "../../hooks/api/api.hook";
import { ssrOnClick } from "../ssr.manager";


///////////////////////////////////
// FILES
//
export const imagePreviewPlugin = (cFile: iFile) => genericReplacementPlugin({
	pattern: regexs.image,
	replacement: matchs => {
		let resEl = document.createElement("div");
		// return resEl;

		let full = matchs[0]
		let sourceHtml = `<div class="mdpreview-source">${full}</div>`
		let url = `${absoluteLinkPathRoot(cFile.folder)}/${matchs[1]}`
		resEl.classList.add('cm-mdpreview-wrapper')
		resEl.classList.add('image-wrapper')
		let btnEnlarge = renderToString(
			<Icon name="faExpand" color={`white`} />
		)

		resEl.innerHTML = `<div class="cm-mdpreview-image" data-src=${url}> <img onerror="this.style.display='none'" src="${url + getUrlTokenParam()}" /></div>${sourceHtml}`

		initSSRLogic()
		return resEl;
	}
})



//
// CLICK MANAGEMENT
//
const initSSRLogic = () => {
	setTimeout(() => {
		ssrOnClick(`.cm-mdpreview-image`, el => {
			if (!el) return
			// @ts-ignore
			let url = el.parentNode.querySelector("img")?.src as string
			// let url = el.parentNode.dataset.src as string
			if (!isString(url) || !url.startsWith("http")) return;
			url = url.replace(getUrlTokenParam(), '')
			getApi(api => {
				api.ui.lightbox.open(0, [url])
			})
		})
	}, 10)
}

export const imagePreviewCss = () => `
.cm-mdpreview-wrapper.image-wrapper {
cursor:pointer;
		.mdpreview-source {
				line-height: initial;
		}
}

`
