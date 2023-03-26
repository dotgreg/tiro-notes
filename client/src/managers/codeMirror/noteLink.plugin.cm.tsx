import { regexs } from "../../../../shared/helpers/regexs.helper";
import { getClientApi2 } from "../../hooks/api/api.hook";
import { ssrFn } from "../ssr.manager";
import { cssVars } from "../style/vars.style.manager";
import { genericReplacementPlugin } from "./replacements.cm";

export const noteLinkPreviewPlugin = (windowId: string) => genericReplacementPlugin({
	pattern: regexs.linklink,
	replacement: matchs => {
		let resEl = document.createElement("span");
		resEl.classList.add('note-link-mdpreview-wrapper')
		resEl.classList.add('note-link-wrapper')

		let notePath = matchs[1]
		let noteTitle = matchs[2]
		let html = generateNoteLink(notePath, noteTitle, windowId);

		resEl.innerHTML = `${html}`;
		return resEl
	}
})

// export const noteLinkActionClick = (el: HTMLElement) => {
// 	// LINK
// 	if (el.classList.contains("title-search-link")) {
// 		noteLinkClickJSLogic(el)
// 		// let link = el.dataset.link
// 		// window.open(link, `popup-preview-link`, 'width=800,height=1000')
// 	}
// }

export const noteLinkPreviewMdCss = () => `
.note-link-mdpreview-wrapper {
}
`

//
// COMMON HTML/CSS/JS NOTE LINK GENERATOR
//
export const ssrNoteLinkFn = (el: HTMLElement) => {
	if (!el) return
	const file = el.dataset.file
	const folder = el.dataset.folder
	const windowId = el.dataset.windowid === '' ? 'active' : el.dataset.windowid
	if (!file || !folder) return
	getClientApi2().then(api => {
		api.ui.browser.goTo(
			folder,
			file, {
			openIn: windowId
		})
	})
}

export const generateNoteLink = (
	noteTitle: string,
	notePath: string,
	windowId: string
): string => {

	const subst = `<a
		onclick="${ssrFn("open-link-page", ssrNoteLinkFn)}"
class="title-search-link preview-link" data-file="${noteTitle}" data-folder="${notePath}" data-windowid="${windowId}">${noteTitle}</a>`;

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
				color: ${cssVars.colors.main};
				background-image: url(${cssVars.assets.linkIcon});
				cursor: pointer;
		}
		${classStr}.resource-link {
				color: ${cssVars.colors.main};
		} `
	return css
}

