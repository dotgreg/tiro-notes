import React from "react";
import { renderToString } from "react-dom/server";
import { regexs } from "../../../../shared/helpers/regexs.helper";
import { iFile } from "../../../../shared/types.shared";
import { RessourcePreview } from "../../components/RessourcePreview.component";
import { genericReplacementPlugin } from "./replacements.cm";

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
