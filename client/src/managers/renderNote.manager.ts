import { each } from "lodash"
import { regexs } from "../../../shared/helpers/regexs.helper"
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




//
// from filecontent string to contentChunks 
//

interface iContentChunk {
	type: 'tag' | 'text',
	tagName?: string
	content: string
}
export const getContentChunks = (fileContent: string): iContentChunk[] => {
	// find texts only parts
	const textChunks = fileContent.split(regexs.userCustomTagManual);

	// and tags parts
	const regex = regexs.userCustomTag3;
	const tagsRaw = fileContent.match(regex) || '';
	const tags: string[] = []
	each(tagsRaw, tag => { tags.push(tag) })

	// create from it contentChunks
	let tagToSearch: string | null = null
	let start = -1
	let contentChunks: iContentChunk[] = []

	each(tags, (tag, i) => {
		if (!tagToSearch) {
			tagToSearch = tag
			start = i
		} else if (tagToSearch === tag) {
			const innerText = textChunks.slice(start + 1, i + 1)
			const innerTags = tags.slice(start + 1, i + 1)
			let tagContent = ``;
			for (let i = 0; i < innerText.length; i++) {
				const tag = i === innerText.length - 1 ? `` : innerTags[i]
				tagContent += `${innerText[i]}${tag}`
			}
			contentChunks.push({
				type: 'tag',
				tagName: tagToSearch,
				content: tagContent,
			})
			start = -1
			tagToSearch = null
		}
	})

	console.log(textChunks, tags, contentChunks);
	// for (let i = 0; i < tags.length; i++) {
	// 	const el = tags[i];
	// 	if (
	// }
	return []

}
export const woop = (srt:string) => {
		return 'woop' + srt
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

