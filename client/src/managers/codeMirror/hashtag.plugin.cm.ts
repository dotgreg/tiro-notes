import { regexs } from "../../../../shared/helpers/regexs.helper";
import { iFile } from "../../../../shared/types.shared";
import { cssVars } from "../style/vars.style.manager";
import { genericReplacementPlugin } from "./replacements.cm";

export const hashtagPreviewPlugin = (file: iFile, windowId:string) => genericReplacementPlugin({
	file,
	windowId,
	pattern: regexs.hashtag,
	replacement: (matchs: any) => {
        // wrap the word with a span so we can style it
		let resEl = document.createElement("span");
        resEl.innerHTML = matchs[0];
        resEl.classList.add("cm-hashtag");
        resEl.setAttribute("data-hashtag", matchs[1]);
        resEl.setAttribute("data-file", file.path);
		return resEl
	},
    options: {
        isAtomic: true,
    }
})

export const hashtagCmPluginCss = () => `
    .cm-hashtag {
        // color: var(--color-text);
        color: grey;
        background: ${cssVars.colors.main};
        color: ${cssVars.colors.mainFont};
        border-radius: 3px;
        padding: 2px 4px;
        margin: 0 2px;
        // display: inline-block;
        font-size: 0.9em;
    }
`