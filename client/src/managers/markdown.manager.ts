import { each } from "lodash";
import { getCustomMdTagRegex } from "../../../shared/helpers/regexs.helper";

const marked = require('marked');

export const md2html = (raw: string): string => {
	return marked(raw)
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

