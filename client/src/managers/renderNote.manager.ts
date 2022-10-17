import { cloneDeep, each, isNumber, random } from "lodash"
import { regexs } from "../../../shared/helpers/regexs.helper"
import { iFile } from "../../../shared/types.shared"
import { getClientApi2 } from "../hooks/api/api.hook"
import { iNoteApi } from "../hooks/api/note.api.hook"
import { noteLinkActionClick, noteLinkClickJSLogic } from "./codeMirror/noteLink.plugin.cm"
import { refreshRenderLatexGlobally } from "./latex.manager"
import { md2html } from "./markdown.manager"
import { escapeHtml, transformImagesInHTML, transformRessourcesInHTML, transformSearchLinks, transformTitleSearchLinks, transformUrlInLinks } from "./textProcessor.manager"


export interface iNoteFuncsApi {
	render: (p: {
		raw: string
		file: iFile
		windowId: string
	}) => string
	injectLogic: Function
	chunks: {
		chunk: (fileContent: string) => iContentChunk[]
		merge: (chunks: iContentChunk[]) => string
	},
}

////////////////////////////////////////////////////
// High level functions for content rendering
//
const renderNoteContent: iNoteApi['render'] = p => {
	const { raw, file, windowId } = { ...p }
	// chunk content in chunks
	const contentChunks = getContentChunks(raw)
	each(contentChunks, c => {
		// transform the content of each text chunk
		if (c.type === 'text') c.content = renderMarkdownToHtml({
			raw: c.content,
			file,
			windowId
		})

		// escape the string content
		if (c.type === 'tag') c.content = escapeHtml(c.content)
	})

	// reassemble everything
	const mergedContent = mergeContentChunks(contentChunks)

	return mergedContent
}

const renderMarkdownToHtml: iNoteApi['render'] = (p): string => {
	const { raw, file, windowId } = { ...p }
	let html = (md2html(
		transformRessourcesInHTML(file,
			transformImagesInHTML(file,
				transformSearchLinks(
					transformTitleSearchLinks(windowId,
						transformUrlInLinks(
							raw
						))))))
	)


	// let idWrapper = `renderWrapper-${random(0, 1000)}`
	// html = `<div id="${idWrapper}">${html}</div>`
	// initRenderLatexInText(`#${idWrapper}`)
	// initRenderLatexInText(".preview-area-wrapper")
	refreshRenderLatexGlobally()
	return html
}


export const bindToElClass = (classn: string, cb: (el: any) => void) => {
	const els = document.getElementsByClassName(classn)
	for (let i = 0; i < els.length; i++) {
		const el: any = els[i];
		el.onclick = () => {
			cb(el)
		}
	}
}

const injectLogicToHtml = (p: {
	fileContent: string,
	file: iFile

}) => {
	// title search links
	bindToElClass('title-search-link', noteLinkClickJSLogic)

	bindToElClass('content-image', el => {
		getClientApi2().then(api => {
			let indexImage = parseInt(el.dataset.index)
			try {
				let images = JSON.parse(decodeURIComponent(el.dataset.images))
				if (!isNumber(indexImage)) indexImage = 0
				api.ui.lightbox.open(indexImage, images)
			} catch (e) {
				console.error(e)
			}
		})
	})

}




////////////////////////////////////////////////////
// CONTENT CHUNKS
// from filecontent string to contentChunks 
//


export interface iContentChunk {
	type: 'tag' | 'text',
	tagName?: string
	content: string
	start: number,
	end: number
}

// const reservedTagNames = ["[[latex]]", "[[l]]"]

const getContentChunks: iNoteApi['chunks']['chunk'] = fileContent => {
	// find texts only parts
	const textChunks = fileContent.split(regexs.userCustomTagManual);

	const ntextChunks: iContentChunk[] = []
	const ntagsChunks: iContentChunk[] = []

	// and tags parts
	const regex = regexs.userCustomTag3;
	const tagsRaw = fileContent.match(regex) || '';
	const tags: string[] = []
	each(tagsRaw, tag => {
		// console.log(333, tag);
		// && !reservedTagNames.includes(p.block.tagName || ""
		// if (reservedTagNames.includes(tag)) return
		tags.push(tag)
	})

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
	// console.log(12126, startByTag, fileContent, tags, closingTags, ntagsChunks, ntextChunks, positions);
	// 
	// merge text and iframe together
	const res: iContentChunk[] = []
	const length = ntagsChunks.length > ntextChunks.length ? ntagsChunks.length : ntextChunks.length
	for (let i = 0; i < length; i++) {
		if (startByTag) {
			if (ntagsChunks[i]) res.push(ntagsChunks[i])
			if (ntextChunks[i]) res.push(ntextChunks[i])
		} else {
			if (ntextChunks[i]) res.push(ntextChunks[i])
			if (ntagsChunks[i]) res.push(ntagsChunks[i])
		}
	}

	// console.log(12127, res, startByTag);
	// console.log(positions, res, res.length)
	return res
}



const mergeContentChunks: iNoteApi['chunks']['merge'] = chunks => {
	let res = ''
	each(chunks, c => {
		if (c.type === 'text') res += c.content
		else if (c.type === 'tag') {
			res += `[[${c.tagName}]]${c.content}[[${c.tagName}]]`
		}
	})
	return res
}


export const noteApiFuncs: iNoteFuncsApi = {
	render: renderNoteContent,
	injectLogic: injectLogicToHtml,
	chunks: {
		chunk: getContentChunks,
		merge: mergeContentChunks
	},
}
