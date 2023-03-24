import { memoize } from "lodash";
import React from "react";
import { renderToString } from "react-dom/server";
import { regexs } from "../../../../shared/helpers/regexs.helper";
import { iFile } from "../../../../shared/types.shared";
import { RessourcePreview } from "../../components/RessourcePreview.component";
import { mem } from "../reactRenderer.manager";
import { genericReplacementPlugin } from "./replacements.cm";

let replacementFn = mem((matchs, cFile) => {
	let full = matchs[0]
	let sourceHtml = `<div class="mdpreview-source">${full}</div>`
	let resEl = document.createElement("span");
	let compoHtml = renderToString(<RessourcePreview markdownTag={full} file={cFile} />)
	resEl.innerHTML = `${compoHtml} ${sourceHtml}`;
	return resEl
})

// let replacementFn = memoize((matchs, cFile) => {
// 	let full = matchs[0]
// 	let sourceHtml = `<div class="mdpreview-source">${full}</div>`
// 	let resEl = document.createElement("span");
// 	let compoHtml = renderToString(<RessourcePreview markdownTag={full} file={cFile} />)
// 	resEl.innerHTML = `${compoHtml} ${sourceHtml}`;
// 	return resEl
// }, (a1, a2) => JSON.stringify([a1, a2]))

// let replacementFn2 = mem((matchs, cFile) => {
// 	let full = matchs[0]
// 	let sourceHtml = `<div class="mdpreview-source">${full}</div>`
// 	let resEl = document.createElement("span");
// 	let compoHtml = renderToString(<RessourcePreview markdownTag={full} file={cFile} />)
// 	resEl.innerHTML = `${compoHtml} ${sourceHtml}`;
// 	return resEl
// }, [matchs, cFile])


export const filePreviewPlugin = (cFile: iFile) => genericReplacementPlugin({
	pattern: regexs.ressource,
	replacement: matchs => {
		// let full = matchs[0]
		// let sourceHtml = `<div class="mdpreview-source">${full}</div>`
		// let resEl = document.createElement("span");
		// let compoHtml = renderToString(<RessourcePreview markdownTag={full} file={cFile} />)
		// // resEl.innerHTML = `${compoHtml} ${sourceHtml}`;
		// // return resEl
		// let full = matchs[0]
		// let sourceHtml = `<div class="mdpreview-source">${full}</div>`
		// let resEl = document.createElement("span");
		// let compoHtml = renderToString(<RessourcePreview markdownTag={full} file={cFile} />)
		// // let compoHtml = renderToMemoString(<RessourcePreview markdownTag={full} file={cFile} />, [full, cFile])
		// resEl.innerHTML = `${compoHtml} ${sourceHtml}`;
		// return resEl
		return replacementFn(matchs, cFile)
		// return replacementFn(matchs, cFile)
		// let replacementFn2 = mem((matchs, cFile) => {
		// 	let full = matchs[0]
		// 	let sourceHtml = `<div class="mdpreview-source">${full}</div>`
		// 	let resEl = document.createElement("span");
		// 	let compoHtml = renderToString(<RessourcePreview markdownTag={full} file={cFile} />)
		// 	resEl.innerHTML = `${compoHtml} ${sourceHtml}`;
		// 	return resEl
		// }, [matchs, cFile])
		// return replacementFn2(matchs, cFile)

	}
})
