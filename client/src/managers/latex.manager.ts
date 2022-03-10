import { each } from 'lodash';
import { regexs } from '../../../shared/helpers/regexs.helper';
import { replaceCustomMdTags } from './markdown.manager';

let katex: any = null;
let isLatexInit = false;
export const initLatex = () => {
	var script = document.createElement('script');
	script.src = 'https://cdn.jsdelivr.net/npm/katex@0.15.2/dist/katex.min.js';
	//@ts-ignore
	script.crossorigin = "anonymous"
	document.body.appendChild(script);
	isLatexInit = true;
	console.log("INIT LATEX");
	script.onload = () => {
		// @ts-ignore
		katex = window.katex;
	};
}

if (!isLatexInit) initLatex();

export const transformLatex = (bodyRaw: string): string => {
	const deps =
		`
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.15.2/dist/katex.css" crossorigin="anonymous">
`;

	bodyRaw = deps + bodyRaw

	let res = replaceCustomMdTags(bodyRaw, '[[latex]]', (input:string) => {
		if (!katex) return input;
		return katex.renderToString(input);
	});

	return res;


}
