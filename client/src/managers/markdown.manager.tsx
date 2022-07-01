import { each, isObject, random, uniq } from "lodash";

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




