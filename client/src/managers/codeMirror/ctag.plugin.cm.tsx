import { regexs } from "../../../../shared/helpers/regexs.helper";
import { genericReplacementPlugin } from "./replacements.cm";

///////////////////////////////////
// CTAG
//
export const ctagPreviewPlugin = genericReplacementPlugin({
	pattern: regexs.userCustomTagFull2,
	replacement: matchs => {
		let resEl = document.createElement("span");
		resEl.innerHTML = `||wooooooooooooooo||`;
		return resEl
	}
})
