import { regexs } from "../../../../shared/helpers/regexs.helper";
import { iFile } from "../../../../shared/types.shared";
import { getApi } from "../../hooks/api/api.hook";
import { ssrFn } from "../ssr.manager";
import { cssVars } from "../style/vars.style.manager";
import { genericReplacementPlugin } from "./replacements.cm";

export const hashtagPreviewPlugin = (file: iFile, windowId:string) => genericReplacementPlugin({
	file,
	windowId,
	pattern: regexs.hashtag,
	replacement: params => {
		const matchs = params.matchs
        // wrap the word with a span so we can style it
		let resEl = document.createElement("span");
        // resEl.innerHTML = matchs[0];
        resEl.classList.add("cm-hashtag");
        // resEl.setAttribute("data-hashtag", matchs[1]);
        // resEl.setAttribute("data-hashtag2", matchs[0]);
        // resEl.setAttribute("data-filepath", file.path);
        // resEl.onclick = ssrFn("detach-link", detachWinFn) //}() => detachWinFn(resEl)
        resEl.innerHTML = `<span class="hash-inner" 
        data-hashtag="${matchs[1]}"
        data-hashtag2="${matchs[0]}"
        data-folder="${file.folder}"
        onclick="${ssrFn("open-win-smartlist-hashtag", detachWinFn)}" >${matchs[0]}</a>`
		return resEl
	},
    options: {
        // isAtomic: true,
        isAtomic: false,
    }
})

const detachWinFn = (el) => {
    if (!el) return
    let hashtag = el.dataset.hashtag2
    let folder = el.dataset.folder
    getApi(api => {
        // api.plugins.get("smartlist","tag", plugin => {
        //     console.log("plugin", plugin);
            // if (!plugin) return console.warn("no plugin, please install smartlist plugin");
            api.ui.floatingPanel.create({
                type: "ctag",
                layout: "full-center",
                ctagConfig: {
                    tagName: "smartlist",
                    content: `- | ${folder} | ${hashtag}`,
                },
            })
        // })
       
    })
}

export const hashtagCmPluginCss = () => `
    .cm-hashtag {
        &:hover {
            opacity: 1;
        }
        opacity: 0.3;
        transition: opacity 0.2s;
        // color: var(--color-text);
        color: grey;
        background: ${cssVars.colors.main};
        color: ${cssVars.colors.mainFont};
        border-radius: 3px;
        padding: 2px 4px;
        margin: 0 2px;
        // display: inline-block;
        font-size: 0.9em;
        .hash-inner {
            cursor: pointer;
        }
    }
`