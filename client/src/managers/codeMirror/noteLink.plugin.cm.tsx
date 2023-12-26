import { debounce } from "lodash";
import { regexs } from "../../../../shared/helpers/regexs.helper";
import { iFile } from "../../../../shared/types.shared";
import { getApi, getClientApi2 } from "../../hooks/api/api.hook";
import { deviceType } from "../device.manager";
import { ssrFn } from "../ssr.manager";
import { cssVars } from "../style/vars.style.manager";
import { genericReplacementPlugin } from "./replacements.cm";

export const noteLinkPreviewPlugin = (file: iFile, windowId: string, linkPreview:boolean) => genericReplacementPlugin({
	file,
	windowId,
	pattern: regexs.linklink,
	replacement: params => {
		const matchs = params.matchs
		let resEl = document.createElement("span");
		resEl.classList.add('note-link-mdpreview-wrapper')
		resEl.classList.add('note-link-wrapper')

		let notePath = matchs[2]
		let noteTitle = matchs[1]
		let searchedStr:string|null = null
		// if notePath has | in it, split it again
		if (notePath.includes("|")) {
			let spl = notePath.split("|")
			notePath = spl[0]
			searchedStr = spl[1]
		}
		let html = generateNoteLink( noteTitle,notePath, searchedStr, windowId, linkPreview);

		resEl.innerHTML = `${html}`;
		return resEl
	}
})



//
// COMMON HTML/CSS/JS NOTE LINK GENERATOR
//
export const ssrNoteLinkFn = (el: HTMLElement) => {
	if (!el) return
	stopDelayedNotePreview()
	reqId++
	

	const file = el.dataset.file
	const folder = el.dataset.folder
	const searchedString = el.dataset.searchedstring
	// const windowId = el.dataset.windowid === '' ? 'active' : el.dataset.windowid
	const windowId = el.dataset.windowid || 'active'
	if (!file || !folder || !windowId) return
	getApi(api => {
		api.ui.browser.goTo(
			folder,
			file, {
			openIn: windowId
		})
	})
}


//
// POPUP HOVER SYSTEM 
// open preview after 2s
//

const ssrNotePreviewOpen = (el: HTMLElement) => {
	if (!el) return
	if (deviceType() !== "desktop") return
	let rect = el.getBoundingClientRect()
	let pos:[number,number] = [
		rect.left + window.scrollX,
		rect.top + window.scrollY
	]
	const file = el.dataset.file
	const folder = el.dataset.folder
	const searchedString = el.dataset.searchedstring
	const windowid = el.dataset.windowid
	const filePath = `${folder}${file}`
	if (windowid === "preview-popup") return
	getApi(api => { api.ui.notePreviewPopup.close()})
	addDelayedAction(filePath, pos, searchedString, windowid)
}

let timeout:any = null
let reqId:number = 0
const ssrNotePreviewClose = (el) => {
	const windowid = el.dataset.windowid
	stopDelayedNotePreview()
	
	if (windowid === "preview-popup") return
	// timeout && clearTimeout(timeout)
}
export const stopDelayedNotePreview = (addDelayCancel?:boolean) => {
	timeout && clearTimeout(timeout)
	// getApi(api => { api.ui.notePreviewPopup.close()})
	reqId++
	if (addDelayCancel) {
		setTimeout(() => {
			reqId++
		}, 700)
	}
}
const addDelayedAction = (filePath, pos, searchedString, windowId) => {
	reqId++
	let histId = reqId
	timeout && clearTimeout(timeout)
	timeout = setTimeout(() => { 
		if (reqId !== histId) return
		if (searchedString === "") searchedString = null
		getApi(api => {
			api.ui.notePreviewPopup.open(filePath, pos, {windowIdToOpenIn:windowId, searchedString:searchedString})
		})
	}, 700)
}


export const generateNoteLink = (
	noteTitle: string,
	notePath: string,
	searchedString: string|null,
	windowId: string,
	linkPreview: boolean
): string => {
	let label = noteTitle
	if (searchedString) {
		let labelSearched = searchedString.length > 20 ? searchedString.substring(0, 20) + "..." : searchedString
		label = `${noteTitle} > ${labelSearched}`
	}

	const subst = `<a
		onclick="${ssrFn("open-link-page", ssrNoteLinkFn)}"
		onmouseenter="${linkPreview && ssrFn("hover-link-page-enter", ssrNotePreviewOpen)}"
		onmouseleave="${linkPreview && ssrFn("hover-link-page-leave", ssrNotePreviewClose)}"
		class="title-search-link preview-link" 
		data-file="${noteTitle}" 
		data-folder="${notePath}" 
		data-searchedstring="${searchedString || ""}"
		data-windowid="${windowId}">${label}</a>`;

	return subst
}

// CSS
export const noteLinkCss = (classStr?: string) => {
	if (!classStr) classStr = ""
	const css = `
			.preview-link {							
				font-weight: 800;
				background-repeat: no-repeat;
				background-position: 4px 2px;
				padding-left: 20px;
				background-size: 10px;
		}

		${classStr}.external-link {
				background-image: url(${cssVars.assets.worldIcon});
		}
		${classStr}.search-link {
				color: ${cssVars.colors.main};
				background-image: url(${cssVars.assets.searchIcon});
		}
		${classStr}.title-search-link {
				transition: 1s all;
				background-color: rgba(0,0,0,0);
				&:hover {
					color: white;
					background-color: ${cssVars.colors.main};
				}
				&.popup-link {
					position: relative;
					z-index: 99;
				}
				color: ${cssVars.colors.main};
				background-image: url(${cssVars.assets.linkIcon});
				cursor: pointer;
		}
		${classStr}.resource-link {
				color: ${cssVars.colors.main};
		} `
	return css
}

