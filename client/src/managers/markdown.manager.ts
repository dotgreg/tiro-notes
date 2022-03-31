import { log } from "console";
import { each, isObject, random, uniq } from "lodash";
import { getCustomMdTagRegex, regexs } from "../../../shared/helpers/regexs.helper";
import { consoleCli } from "./cliConsole.manager";

const marked = require('marked');

export const md2html = (raw: string): string => {
	const res = marked(raw);
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

// replace [[calendar]] by the content of /.tiro/tags/calendar.md note
export const replaceUserCustomMdTag = (
	body: string,
): string => {
	const regex = regexs.userCustomTag3;
	const matches = body.match(regex) || '';

	// gather all different user custom tags
	const uniqMatches = uniq(matches)

	// for each unique tag, replace it with its equivalent 
	console.log(uniqMatches);

	const getFileContent = consoleCli['clientApiGetFileContent']
	const renderNoteContent = consoleCli['renderNoteContent']

	each(uniqMatches, userTag => {
		if (userTag === '[[script]]') return

		body = replaceCustomMdTags(body, userTag,
			(innerTag) => {

				userTag = userTag.replace('[[', '').replace(']]', '');
				const id = `${userTag}-${random(0, 100000000)}-custom-tag-wrapper`;

				// get the content of /.tiro/tags/${userTag}.md
				if (getFileContent && getFileContent.f) {
					getFileContent.f(`/.tiro/tags/${userTag}.md`, noteContent => {
						const el = document.getElementById(id)

						if (!el || !noteContent || !renderNoteContent || !renderNoteContent.f) return
						// replace {{innerTag}} inside fetched noteContent
						noteContent = noteContent.replace('{{innerTag}}', innerTag)
						// render it
						el.innerHTML = renderNoteContent.f(noteContent);
					})
				}

				// return a html div tag that get filled later
				return `<div id="${id}"></div>`
			});
	})

	console.log(121333, body);
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
				} catch { }
			}
		})
		let finalRes = t3.join('')
		console.log(`[MD TAG ANALYZER] ${tag}`, t3, finalRes);
		res = res.replace(regex, finalRes);

	};
	return res;
};

