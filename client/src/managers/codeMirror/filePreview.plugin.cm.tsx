import React from "react";
import { renderToString } from "react-dom/server";
import { regexs } from "../../../../shared/helpers/regexs.helper";
import { iFile } from "../../../../shared/types.shared";
import { RessourcePreview } from "../../components/RessourcePreview.component";
import { getFileType } from "../file.manager";
import { generateImagePreviewHtml } from "./image.plugin.cm";
import { genericReplacementPlugin } from "./replacements.cm";

let compoHtml = (matchs, cFile, windowId) => {
	let full = matchs[0]
	let sourceHtml = `<div class="mdpreview-source">${full}</div>`
	let compoHtml = renderToString(<RessourcePreview markdownTag={full} file={cFile} windowId={windowId} />)
	return `${compoHtml} ${sourceHtml}`;
}


export const filePreviewPlugin = (file: iFile, windowId:string) => genericReplacementPlugin({
	file,
	windowId,
	pattern: regexs.ressource,
	replacement: params => {
		const matchs = params.matchs
		let resEl = document.createElement("span");
		let url = matchs[2]
		if (getFileType(url) === 'none') {
			// if no filetype, fallback by default on image
			// for links like ![image](https://github.com/dotgreg/tiro-notes/assets/2981891/0a1f-4463-804b-22b6134a29cf0)
			// to work
			resEl.innerHTML = generateImagePreviewHtml(matchs[0], matchs[2], file, true)
		} else {
			resEl.innerHTML = compoHtml(matchs, file, windowId)
		}
		return resEl
	}
})
