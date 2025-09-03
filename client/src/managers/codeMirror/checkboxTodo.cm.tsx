import { regexs } from "../../../../shared/helpers/regexs.helper";
import { iFile } from "../../../../shared/types.shared";
import { getApi } from "../../hooks/api/api.hook";
import { ssrFn } from "../ssr.manager";
import { cssVars } from "../style/vars.style.manager";
import { genericReplacementPlugin } from "./replacements.cm";
import { getFontSize } from "../font.manager";

export const checkboxTodoCmPlugin = (file: iFile, windowId:string) => genericReplacementPlugin({
	file,
	windowId,
	pattern: regexs.checkbox,
	replacement: params => {
        const { matchs, view, pos } = params
		let resEl = document.createElement("span");
        let checkboxRaw = matchs[0]
        let isChecked = checkboxRaw.toLocaleLowerCase().includes("x")
        let checkedStr = isChecked ? "checked='checked'" : ""
		resEl.innerHTML = `<span class="checkbox-todo-cm-wrapper">` +
        `<input type="checkbox" id="checkbox-todo-cm-input" ${checkedStr}`+
        `data-replacepos="${pos}"  data-ischecked="${isChecked}" data-windowid="${windowId}" value="" `+
        `onchange="${ssrFn("replace-checkbox-todo-text", replaceCheckboxTodoText)}"/></span>`;
		return resEl;
	},
    options: {
        cache: false
    }
})

const replaceCheckboxTodoText = (el) => {
    if (!el) return
    let pos = el.dataset.replacepos
    let windowId = el.dataset.windowid
    let isChecked = el.dataset.ischecked
    pos = parseInt(pos) || -1
    if (pos === -1) return console.warn("no pos")
    getApi(api => {
        // console.log("replaceCheckboxTodotext", isChecked, pos)
        api.ui.note.editorAction.dispatch({
            windowId: windowId,
            type:"replaceText", 
            replaceText: isChecked === "true" ? "[ ]" : "[x]",
            replacePos: pos
        })
    })
}

export const checkboxTodoCmPluginCss = () => `
    .checkbox-todo-cm-wrapper {
        cursor: pointer;
        input {
            position: relative;
            top: 4px;
            transform: scale(.7);
            cursor: pointer;
            margin: 0px;
        }
    }
`