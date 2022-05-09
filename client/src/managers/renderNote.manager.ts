import { each } from "lodash"
import { getClientApi2 } from "../hooks/api/api.hook"
import { transformLatex } from "./latex.manager"
import { cleanCustomTagsCache, md2html, replaceUserCustomMdTag } from "./markdown.manager"
import { transformMarkdownScripts } from "./scriptsInMarkdown.manager"
import { transformImagesInHTML, transformRessourcesInHTML, transformSearchLinks, transformTitleSearchLinks, transformUrlInLinks } from "./textProcessor.manager"


export interface iNoteApi {
	render: (p: {
		raw: string
		currentFolder: string
		windowId: string
	}) => string
	injectLogic: Function
	customTags: {
		cache: {
			clean: Function
		}
	}
}

const renderNoteContent: iNoteApi['render'] = p => {
	const { raw, currentFolder, windowId } = { ...p }
	return md2html(
		transformRessourcesInHTML(currentFolder,
			transformImagesInHTML(currentFolder,
				transformSearchLinks(
					transformTitleSearchLinks(windowId,
						transformUrlInLinks(
							transformMarkdownScripts(
								replaceUserCustomMdTag({ currentFolder, windowId },
									transformLatex(
										raw
									)))))))))

}
const bindToElClass = (classn: string, cb: (el: any) => void) => {
	const els = document.getElementsByClassName(classn)
	each(els, (el: any) => {
		el.onclick = () => {
			cb(el)
		}
	})
}

const injectLogicToHtml = () => {
	// title search links
	bindToElClass('title-search-link', el => {
		const file = el.dataset.file
		const folder = el.dataset.folder
		const windowId = el.dataset.windowid
		getClientApi2().then(api => {
			api.ui.browser.goTo(
				folder,
				file, {
				openIn: windowId
			})
		})
	})
	// refresh custom tag link
	bindToElClass('custom-tag-refresh', el => {
		noteApi.customTags.cache.clean()
	})
}

export const noteApi: iNoteApi = {
	render: renderNoteContent,
	injectLogic: injectLogicToHtml,
	customTags: {
		cache: {
			clean: cleanCustomTagsCache
		}
	}
}

