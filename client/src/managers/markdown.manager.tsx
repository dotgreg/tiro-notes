import { each, isObject, random, uniq } from "lodash";
import { cleanPath } from "../../../shared/helpers/filename.helper";

const marked = require('marked');

export const md2html = (raw: string): string => {
	let res = marked(raw);
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




export const replaceCustomMdTags = (
	body: string,
	tag: string,
	funcToExec: (str: string) => string
): string => {
	let res = body;
	//const regex = getCustomMdTagRegex(tag);
	const tagName = tag.replace('[[', '').replace(']]', '')
	const regStr = `(?:\\[\\[${tagName}\\]\\])((?:[^]*))(?:\\[\\[${tagName}\\]\\])`
	const regex = new RegExp(regStr, "gm");

	const t1 = res.match(regex) || '';
	if (t1[0]) {
		//"" "[[script]] blablabla [[script]]" "out" "[[script]] blablabla2 [[script]]" ""
		let t2 = t1[0].split(tag);
		let t3: string[] = [];

		//"[[script]] blablabla [[script]]" "out" "[[script]] blablabla2 [[script]]" 
		for (let i = 0; i < t2.length; i++) {
			const str = t2[i];
			if (str !== '') t3.push(str);
		}

		//EXEC>"[[script]] blablabla [[script]]"
		//NO>"out"
		//EXEC>"[[script]] blablabla2 [[script]]" 
		for (let i = 0; i < t3.length; i++) {
			const str = t3[i];
			if (i % 2 === 0) {
				try {
					t3[i] = funcToExec(t3[i]);
				} catch (e) {
					console.warn(`[REPLACE CUSTOM MD TAGS] error: ${e}`, t3[i])
				}
			}
		}

		let finalRes = t3.join('')
		// console.log(`00565 [MD TAG ANALYZER] ${tag}`, { regStr, t1, t2, t3, finalRes });
		res = res.replace(regex, finalRes);

	};
	return res;
};

// take all the content and create a list of titles
// [[title-id-1, 20, 200][title-id-2, 201, 300]]
export type iMdPart = { id: string, title: string, line: number }
export type iMdStructure = iMdPart[]
export const getMdStructure = (noteContent: string): iMdStructure => {
	const res: iMdStructure = []

	// get raw datas
	const lines = noteContent.split("\n")
	const resArr: any[] = []
	let cnt = 0;
	for (let i = 0; i < lines.length; i++) {
		const lineStr = lines[i]
		const matches = [...lineStr.matchAll(/([#]{1,9})\ (.+)/gi)];
		if (matches.length > 0) {
			const m = matches[0]
			const title = m[2].toLowerCase()
			const line = i
			let id = title.split(" ").join("-").replace(/[^a-zA-Z0-9-_À-ú]/gi, "")

			// if id already exists in resArr, adds a -1
			let idExists = false
			each(resArr, pTitle => { if (pTitle.id === id) idExists = true })
			if (idExists) id = id + '-1'
			resArr.push({ raw: lineStr, matches: m, id, line, title, ranking: m[1].length })
			res.push({ id, title, line })
		}
	}

	// console.log(333, resArr);

	return res
}


