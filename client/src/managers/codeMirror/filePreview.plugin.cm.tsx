import React from "react";
import { renderToString } from "react-dom/server";
import { regexs } from "../../../../shared/helpers/regexs.helper";
import { iFile } from "../../../../shared/types.shared";
import { RessourcePreview } from "../../components/RessourcePreview.component";
import { genericReplacementPlugin } from "./replacements.cm";

let compoHtml = (matchs, cFile) => {
	let full = matchs[0]
	let sourceHtml = `<div class="mdpreview-source">${full}</div>`
	let compoHtml = renderToString(<RessourcePreview markdownTag={full} file={cFile} />)
	return `${compoHtml} ${sourceHtml}`;
}


export const filePreviewPlugin = (cFile: iFile, cacheNodeId: string|null) => genericReplacementPlugin({
	pattern: regexs.ressource,
	replacement: matchs => {
		let resEl = document.createElement("span");
		resEl.innerHTML = compoHtml(matchs, cFile)
		return resEl
	}
})
