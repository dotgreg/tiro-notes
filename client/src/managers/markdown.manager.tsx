import { each, isObject, random, uniq } from "lodash";
import { generateUUID } from "../../../shared/helpers/id.helper";
import { getCustomMdTagRegex, regexs } from "../../../shared/helpers/regexs.helper";
import { getClientApi2 } from "../hooks/api/api.hook";
import { noteApi } from "./renderNote.manager";

const marked = require('marked');

export const md2html = (raw: string): string => {
	let res = marked(raw);

	// res = res.replaceAll('\n', '<br>')
	// res = res.replaceAll('\r', '<br>')
	// 

	return res;
}

export const replaceRegexInMd = (
	body: string,
	regex: RegExp,
	funcToExec: (str: string) => string
): string => {
	let res = body;
	const matches = res.match(regex) || '';
	each(matches, match => {
		res = res.replace(match, funcToExec(match));
	});
	return res;
};



// CACHING MECHANISM FOR CUSTOM TAGS
const customTagsCache: {
	[uniqueCacheId: string]: string
} = {}
export const cleanCustomTagsCache = () => {
	console.log('[CUSTOM TAGS] cleaning cache');
	for (const key in customTagsCache) {
		delete customTagsCache[key];
	}
}

// CUSTOM TAGS LOGIC
// replace [[calendar]] by the content of /.tiro/tags/calendar.md note
export const replaceUserCustomMdTag = (p: {
	windowId: string
	currentFolder: string
}, body): string => {

	const { windowId, currentFolder } = p
	const regex = regexs.userCustomTag3;
	const matches = body.match(regex) || '';

	const m2 = body.split(/\[\[[a-zA-Z-_\/]*\]\]/);
	//console.log(matches, m2);
	// gather all different user custom tags
	const uniqMatches = uniq(matches) as string[]

	// for each unique tag, replace it with its equivalent 
	//console.log(uniqMatches);

	// const getFileContent = consoleCli['clientApiGetFileContent']
	// const renderNoteContent = consoleCli['renderNoteContent']
	// 
	each(uniqMatches, userTag => {
		if (userTag === '[[script]]') return

		body = replaceCustomMdTags(body, userTag,
			(innerTag) => {

				userTag = userTag.replace('[[', '').replace(']]', '');
				const id = `${userTag}-${generateUUID()}-custom-tag-wrapper`;

				// check if content already cached 
				const cacheId = `${userTag}-${innerTag}`
				let cachedContent = ``


				if (!customTagsCache[cacheId]) {
					// get the content of /.tiro/tags/${userTag}.md
					getClientApi2().then(api => {
						api.file.getContent(`/.tiro/tags/${userTag}.md`, noteContent => {
							console.log(noteContent);
							const el = document.getElementById(id)

							// if (!el || !noteContent || !renderNoteContent || !renderNoteContent.f) return
							if (!el || !noteContent) return
							// replace {{innerTag}} inside fetched noteContent
							noteContent = noteContent.replace('{{innerTag}}', innerTag)
							// render it
							const finalHtml = noteApi.render({
								raw: noteContent,
								currentFolder,
								windowId
							})

							// caching it
							customTagsCache[cacheId] = finalHtml

							// replacing html by it and injecting js logic action
							el.innerHTML = customTagsCache[cacheId]
							noteApi.injectLogic()
						})
					})
				} else {
					cachedContent = customTagsCache[cacheId]
					setTimeout(() => {
						noteApi.injectLogic()
					})
				}

				return `<div class="custom-tag-wrapper">
						<div class="custom-tag-content" id="${id}">
							${cachedContent}
						</div>
						<div class="custom-tag-refresh">r</div>
					</div>`
			});
	})

	return body;
};

export const replaceCustomMdTags = (
	body: string,
	tag: string,
	funcToExec: (str: string) => string
): string => {
	let res = body;
	const regex = getCustomMdTagRegex(tag);

	const t1 = res.match(regex) || '';
	if (t1[0]) {
		let t2 = t1[0].split(tag);
		let t3: string[] = [];
		each(t2, str => {
			if (str !== '') t3.push(str);
		})
		each(t3, (str, i) => {
			if (i % 2 === 0) {
				try {
					t3[i] = funcToExec(t3[i]);
				} catch (e) {
				}
			}
		})
		let finalRes = t3.join('')
		//console.log(`[MD TAG ANALYZER] ${tag}`, t3, finalRes);
		res = res.replace(regex, finalRes);

	};
	return res;
};



