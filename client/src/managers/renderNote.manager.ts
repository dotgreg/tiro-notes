import { cloneDeep, each } from "lodash"
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

export interface iContentChunk {
	type: 'tag' | 'text',
	tagName?: string
	content: string
	start: number,
	end: number
}
export const getContentChunks = (fileContent: string, debug = false): iContentChunk[] => {
	// find texts only parts
	const textChunks = fileContent.split(regexs.userCustomTagManual);

	const ntextChunks: iContentChunk[] = []
	const ntagsChunks: iContentChunk[] = []

	// and tags parts
	const regex = regexs.userCustomTag3;
	const tagsRaw = fileContent.match(regex) || '';
	const tags: string[] = []
	each(tagsRaw, tag => { tags.push(tag) })

	// create from it contentChunks
	let tagToSearch: string | null = null
	let start = -1
	let contentChunks: iContentChunk[] = []

	const positions: number[] = []


	// only search for closing tags
	const closingTags: string[] = []
	const tagsCount: { [tag: string]: number } = {}
	each(tags, tag => {
		if (!tagsCount[tag]) tagsCount[tag] = 1
		else tagsCount[tag] = tagsCount[tag] + 1
	})

	each(tagsCount, (count, name) => {
		if (count >= 2) closingTags.push(name)
	})

	// debug && console.log(tags, tagsCount, closingTags);

	each(tags, (tag, i) => {

		// check if tag occurence appears in pair, otherwise pass it
		if (!closingTags.includes(tag)) return

		if (!tagToSearch) {
			// START TAG FOUND
			tagToSearch = tag
			start = i
		} else if (tagToSearch === tag) {
			// END TAG FOUND
			const t = [start + 1, i + 1]
			positions.push(...t)
			const innerText = textChunks.slice(t[0], t[1])
			// add other in nTextChunk
			const innerTags = tags.slice(start + 1, i + 1)
			let tagContent = ``;
			for (let i = 0; i < innerText.length; i++) {
				const tag = i === innerText.length - 1 ? `` : innerTags[i]
				tagContent += `${innerText[i]}${tag}`
			}

			// insert tag
			ntagsChunks.push({
				type: 'tag',
				tagName: tagToSearch.replace('[[', '').replace(']]', ''),
				content: tagContent,
				start,
				end: i
			})
			start = -1
			tagToSearch = null
		}
	})


	if (positions.length === 0) {
		// if no closing tags detected
		ntextChunks.push({
			type: "text",
			content: fileContent,
			start: 0,
			end: 1
		})

	} else {
		// then insert texts between tags
		positions.unshift(0)
		for (let i = 0; i < positions.length; i = i + 2) {
			const pos = positions[i]
			if (textChunks[pos]) ntextChunks.push({
				type: "text",
				content: textChunks[pos],
				start: pos,
				end: pos + 1
			})
		}

	}

	const startByTag = fileContent.indexOf(tags[0]) === 0
	debug && console.log(startByTag, fileContent, tags, closingTags, ntagsChunks, ntextChunks, positions);

	// merge text and iframe together
	const res: iContentChunk[] = []
	each(ntextChunks, (txtChunk, i) => {
		if (startByTag) {
			if (ntagsChunks[i]) res.push(ntagsChunks[i])
			if (ntextChunks[i]) res.push(ntextChunks[i])
		} else {
			if (ntextChunks[i]) res.push(ntextChunks[i])
			if (ntagsChunks[i]) res.push(ntagsChunks[i])
		}
	})


	// console.log(positions, res, res.length)
	return res

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

