import { parse } from "path";
import { regexs } from "../../../../shared/helpers/regexs.helper";
import { iFile } from "../../../../shared/types.shared";
import { getApi } from "../../hooks/api/api.hook";
import { ssrFn } from "../ssr.manager";
import { cssVars } from "../style/vars.style.manager";
import { genericReplacementPlugin } from "./replacements.cm";

export const datePickerCmPlugin = (file: iFile, windowId:string) => genericReplacementPlugin({
	file,
	windowId,
	pattern: regexs.dateFrFormat,
	replacement: params => {
        const { matchs, view, pos } = params
        // console.log(params)
		let resEl = document.createElement("span");
		// resEl.innerHTML = `<span class="date-picker-cm-wrapper"> ${matchs[0]} </span>`;

        // let date = new Date(matchs[0])
        let dateRaw = matchs[0]
        let dateArr = dateRaw.split("/")
        let dateInput =  `${dateArr[2]}-${dateArr[1]}-${dateArr[0]}`

        
        // getApi(api => {
		// 	api.ui.note.editorAction.dispatch({
		// 		type:"insertText", 
		// 		insertText: "woop",
        //         insertPos: 128
		// 	})
		// })
        
		resEl.innerHTML = `<span class="date-picker-cm-wrapper"><input type="date" id="date-picker-cm-input" lang="fr-FR" data-replacepos="${pos}" value="${dateInput}" onchange="${ssrFn("replace-date-text-datepicker", replaceDateText)}"/></span>`;
        // let resEl = "woop"
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
    console.log("el", el.value, pos)
    let dateArr2 = el.value.split("-")
    let dateInput =  `${dateArr2[2]}/${dateArr2[1]}/${dateArr2[0]}`
    pos = parseInt(pos) || -1
    if (pos === -1) return console.warn("no pos")

    // ici on pourrait loader le contenu de la note, trouver la premiere occurence de la date a remplacer, et la remplacer
    // mais si plusieurs dates sont identiques, on ne sait pas laquelle remplacer

    // 

    getApi(api => {
        console.log("replacedatetext", dateInput, pos)
        api.ui.note.editorAction.dispatch({
            type:"replaceText", 
            replaceText: dateInput,
            replacePos: pos
        })
    })
    // let hashtag = el.dataset.hashtag2
    // let folder = el.dataset.folder
    // getApi(api => {
    //     // api.plugins.get("smartlist","tag", plugin => {
    //     //     console.log("plugin", plugin);
    //         // if (!plugin) return console.warn("no plugin, please install smartlist plugin");
    //         api.ui.floatingPanel.create({
    //             type: "ctag",
    //             layout: "full-center",
    //             ctagConfig: {
    //                 tagName: "smartlist",
    //                 content: `- | ${folder} | ${hashtag}`,
    //             },
    //         })
    //     // })
       
    // })
}

export const datePickerCmPluginCss = () => `
    .date-picker-cm-wrapper {
        // &:hover {
        //     opacity: 1;
        // }
        // opacity: 0.3;
        // background: ${cssVars.colors.main};
        // color: ${cssVars.colors.mainFont};
        input {
            padding: 0px;
            border: none;
            font-size: 10px;
            font-weight: 400;
            font-family: Consolas, monaco, monospace;
            margin-right: 0px;
            color:#4d4d4d;
            height: 30px;
        }
    }
`