import { replaceCustomMdTags } from './markdown.manager';

let katex: any = null;
let isLatexInit = false;
const cssUrl = "https://cdn.jsdelivr.net/npm/katex@0.15.2/dist/katex.css"
const jsUrl = "https://cdn.jsdelivr.net/npm/katex@0.15.2/dist/katex.min.js"

const addCss = (fileName: string) => {

	// var head = document.head;
	var link = document.createElement("link");

	link.type = "text/css";
	link.rel = "stylesheet";
	link.href = fileName;

	document.body.appendChild(link);
}

export const initLatex = () => {
	var script = document.createElement('script');
	script.src = jsUrl;
	//@ts-ignore
	script.crossorigin = "anonymous"
	document.body.appendChild(script);
	isLatexInit = true;
	// console.log("INIT LATEX");
	script.onload = () => {
		// @ts-ignore
		katex = window.katex;
	};
	addCss(cssUrl)
}

if (!isLatexInit) initLatex();

export const transformLatex = (bodyRaw: string): string => {
	bodyRaw = bodyRaw

	const replaceFn = (input: string) => {
		if (!katex) return input;
		return katex.renderToString(input);
	}

	let res = replaceCustomMdTags(bodyRaw, '[[latex]]', replaceFn);
	res = replaceCustomMdTags(res, '[[l]]', replaceFn);

	return res;

}

export const renderLatex = (str: string): string => {
	if (!katex) return str;
	return katex.renderToString(str);
}
