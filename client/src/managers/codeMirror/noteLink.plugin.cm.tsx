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
	replacement: matchs => {
		let resEl = document.createElement("span");
		resEl.classList.add('note-link-mdpreview-wrapper')
		resEl.classList.add('note-link-wrapper')

		let notePath = matchs[1]
		let noteTitle = matchs[2]
		let html = generateNoteLink(notePath, noteTitle, windowId, linkPreview);

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
	const file = el.dataset.file
	const folder = el.dataset.folder
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
	const windowid = el.dataset.windowid
	const filePath = `${folder}${file}`
	if (windowid === "preview-popup") return
	getApi(api => { api.ui.notePreviewPopup.close()})
	addDelayedAction(filePath, pos, windowid)
}

let timeout:any = null
const ssrNotePreviewClose = (el) => {
	const windowid = el.dataset.windowid
	stopDelayedNotePreview()
	if (windowid === "preview-popup") return
	timeout && clearTimeout(timeout)
}
export const stopDelayedNotePreview = () => {
	timeout && clearTimeout(timeout)
	// getApi(api => { api.ui.notePreviewPopup.close()})
	setTimeout(() => {
		timeout && clearTimeout(timeout)
		// getApi(api => { api.ui.notePreviewPopup.close()})
	}, 300)
}
const addDelayedAction = (filePath, pos, windowId) => {
	console.log("adddelayed action", filePath, pos, windowId)
	timeout && clearTimeout(timeout)
	timeout = setTimeout(() => { 
		getApi(api => {
			api.ui.notePreviewPopup.open(filePath, pos, {windowIdToOpenIn:windowId})
		})
	}, 1000)
}


export const generateNoteLink = (
	noteTitle: string,
	notePath: string,
	windowId: string,
	linkPreview: boolean
): string => {

	const subst = `<a
		onclick="${ssrFn("open-link-page", ssrNoteLinkFn)}"
		onmouseenter="${linkPreview && ssrFn("hover-link-page-enter", ssrNotePreviewOpen)}"
		onmouseleave="${linkPreview && ssrFn("hover-link-page-leave", ssrNotePreviewClose)}"
		class="title-search-link preview-link" 
		data-file="${noteTitle}" 
		data-folder="${notePath}" 
		data-windowid="${windowId}">${noteTitle}</a>`;

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

