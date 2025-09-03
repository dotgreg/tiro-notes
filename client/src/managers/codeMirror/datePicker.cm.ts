import { parse } from "path";
import { regexs } from "../../../../shared/helpers/regexs.helper";
import { iFile } from "../../../../shared/types.shared";
import { getApi } from "../../hooks/api/api.hook";
import { ssrFn } from "../ssr.manager";
import { cssVars } from "../style/vars.style.manager";
import { genericReplacementPlugin } from "./replacements.cm";
import { getFontSize } from "../font.manager";
import { css } from "@emotion/react";

export const datePickerCmPlugin = (file: iFile, windowId:string) => genericReplacementPlugin({
	file,
	windowId,
	pattern: regexs.dateFrFormat,
	replacement: params => {
        const { matchs, view, pos } = params
		let resEl = document.createElement("span");
        let dateRaw = matchs[0]
        let dateArr = dateRaw.split("/")
        let dateInput =  `${dateArr[2]}-${dateArr[1]}-${dateArr[0]}`
		resEl.innerHTML = `<span class="date-picker-cm-wrapper"><input type="date" id="date-picker-cm-input" lang="fr-FR" data-replacepos="${pos}" data-windowid="${windowId}" value="${dateInput}" onchange="${ssrFn("replace-date-text-datepicker", replaceDateText)}"/></span>`;
		return resEl;
	},
    options: {
        cache: false
    }
})

const replaceDateText = (el) => {
    console.log("el1")
    if (!el) return
    let pos = el.dataset.replacepos
    let windowId = el.dataset.windowid
    console.log("el", el.value, pos)
    let dateArr2 = el.value.split("-")
    let dateInput =  `${dateArr2[2]}/${dateArr2[1]}/${dateArr2[0]}`
    pos = parseInt(pos) || -1
    if (pos === -1) return console.warn("no pos")
    getApi(api => {
        console.log("replacedatetext", dateInput, pos)
        api.ui.note.editorAction.dispatch({
            windowId: windowId,
            type:"replaceText", 
            replaceText: dateInput,
            replacePos: pos
        })
    })
}

export const datePickerCmPluginCss = () => `
    .date-picker-cm-wrapper {
        cursor: pointer;
        input {
            padding: 0px;
            border: none;
            font-size: ${getFontSize()}px;
            font-weight: 400;
            font-family: ${cssVars.font.editor};
            margin-right: 0px;
            color: #4d4d4d;
            background: #e9e9e9;
            position: relative;
            border-radius: 3px;
            padding: 2px 6px;
            cursor: pointer;
        }
    }
`