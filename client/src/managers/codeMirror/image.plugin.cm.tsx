import React from "react";
import { renderToString } from "react-dom/server";
import { regexs } from "../../../../shared/helpers/regexs.helper";
import { iFile } from "../../../../shared/types.shared";
import { absoluteLinkPathRoot } from "../textProcessor.manager";
import { genericReplacementPlugin } from "./replacements.cm";
import { Icon } from "../../components/Icon.component";
import { getUrlTokenParam } from "../../hooks/app/loginToken.hook";
import { RessourcePreview } from "../../components/RessourcePreview.component";


///////////////////////////////////
// FILES
//
export const imagePreviewPlugin = (cFile: iFile) => genericReplacementPlugin({
	pattern: regexs.image,
	replacement: matchs => {

		let full = matchs[0]
		let sourceHtml = `<div class="mdpreview-source">${full}</div>`
		let resEl = document.createElement("div");
		let url = `${absoluteLinkPathRoot(cFile.folder)}/${matchs[1]}`
		resEl.classList.add('cm-mdpreview-wrapper')
		resEl.classList.add('image-wrapper')
		let btnEnlarge = renderToString(
			<div className="enlarge" data-src={url}>
				<Icon name="faExpand" color={`white`} />
			</div>
		)

		resEl.innerHTML = `<div class="cm-mdpreview-image" >${btnEnlarge}<img onerror="this.style.display='none'" src="${url + getUrlTokenParam()}" /></div>${sourceHtml}`

		return resEl;
	}
})


export const filePreviewPlugin = (cFile: iFile) => genericReplacementPlugin({
	pattern: regexs.ressource,
	replacement: matchs => {
		let full = matchs[0]
		let sourceHtml = `<div class="mdpreview-source">${full}</div>`
		let resEl = document.createElement("span");
		let compoHtml = renderToString(<RessourcePreview markdownTag={full} file={cFile} />)
		resEl.innerHTML = `${compoHtml} ${sourceHtml}`;
		return resEl
	}
})



export const imagePreviewCss = () => `
.cm-mdpreview-wrapper.image-wrapper {
		.mdpreview-source {
				line-height: initial;
		}
}

`
