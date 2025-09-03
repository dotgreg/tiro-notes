import { parse } from "path";
import { regexs } from "../../../../shared/helpers/regexs.helper";
import { iFile } from "../../../../shared/types.shared";
import { getApi } from "../../hooks/api/api.hook";
import { ssrFn } from "../ssr.manager";
import { cssVars } from "../style/vars.style.manager";
import { genericReplacementPlugin } from "./replacements.cm";
import { getFontSize } from "../font.manager";
import { css } from "@emotion/react";

export const markdownSynthaxCmPlugin = (file: iFile, windowId:string) => genericReplacementPlugin({
	file,
	windowId,
	pattern: regexs.boldOrStrike,
	replacement: params => {
        const { matchs, view, pos } = params
		let resEl = document.createElement("span");
        resEl.classList.add("markdown-synthax-cm-wrapper");
        let decorator = ""
        if (matchs[0].startsWith("***")) decorator = "***"
        else if (matchs[0].startsWith("**")) decorator = "**"
        else if (matchs[0].startsWith("~~")) decorator = "~~"
        else if (matchs[0].startsWith("__")) decorator = "__"
        else if (matchs[0].startsWith("*")) decorator = "*"
        if (decorator === "**") resEl.classList.add("bold")
        if (decorator === "~~") resEl.classList.add("strike")
        if (decorator === "__") resEl.classList.add("bold")
        if (decorator === "*") resEl.classList.add("italic")
        if (decorator === "***") resEl.classList.add("bold_and_italic")
        let content = matchs[0]
        // console.log(matchs, view, pos)
        content = content.replaceAll(decorator, "")
        resEl.innerHTML = `${content}`;  
		return resEl;
	},
    options: {
        cache: false
    }
})



export const markdownSynthaxCmPluginCss = () => `
    .markdown-synthax-cm-wrapper {
        &.bold {
            font-weight: bold;
        }
        &.strike {
            text-decoration: line-through;
        }
        &.italic {
            font-style: italic;
        }
        &.bold_and_italic {
            font-weight: bold;
            font-style: italic;
        }
    }
`