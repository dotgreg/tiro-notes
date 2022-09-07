import { debounce, each } from "lodash";
import { sharedConfig } from "../../../shared/shared.config";

let katex: any = null;
let renderMathInElement: any = null;
let isLatexInit = false;

const cssUrl = "https://cdn.jsdelivr.net/npm/katex@0.15.2/dist/katex.css"
const jsUrl = "https://cdn.jsdelivr.net/npm/katex@0.15.2/dist/katex.min.js"
const jsAutoRenderUrl = "https://cdn.jsdelivr.net/npm/katex@0.16.2/dist/contrib/auto-render.min.js"

const h = `[LATEX]`
const log = sharedConfig.client.log.verbose

const addCss = (fileName: string) => {

	// var head = document.head;
	var link = document.createElement("link");

	link.type = "text/css";
	link.rel = "stylesheet";
	link.href = fileName;

	document.body.appendChild(link);
}

const loadScript = (url: string, onLoad: Function) => {
	var script = document.createElement('script');
	script.src = url;
	//@ts-ignore
	script.crossorigin = "anonymous"
	document.body.appendChild(script);
	script.onload = () => { onLoad() }
}
export const initLatex = () => {
	loadScript(jsUrl, () => {
		loadScript(jsAutoRenderUrl, () => {
			isLatexInit = true;
			// @ts-ignore
			katex = window.katex;
			// @ts-ignore
			renderMathInElement = window.renderMathInElement;
		})
	})
	addCss(cssUrl)
}

if (!isLatexInit) initLatex();

export const renderLatex = (str: string): string => {
	let res = str
	if (!katex) return res;
	try {
		res = katex.renderToString(str);
	} catch (e) {
		log && console.log("LATEX ERR:", e);
	}
	return res
}



//
// GLOBAL LATEX SYSTEM
//
export const refreshRenderLatexGlobally = debounce(() => {

	// log && console.log(h, "REFRESH");
	console.log(h, "REFRESH");
	initRenderLatexInText(".render-latex")
}, 100)

const initRenderLatexInText = (elPath: string) => {
	if (!renderMathInElement) return;
	const els = document.querySelectorAll(elPath)
	if (!els) return console.warn(h, "no el found :", elPath)
	log && console.log(h, els);
	each(els, el => {
		renderMathInElement(el, {
			// customised options
			// • auto-render specific keys, e.g.:
			delimiters: [
				{ left: '$$', right: '$$', display: true },
				{ left: '$', right: '$', display: false },
				{ left: '\\(', right: '\\)', display: true },
				{ left: '[[l]]', right: '[[l]]', display: true },
				{ left: '\\[', right: '\\]', display: true }
			],
			// • rendering keys, e.g.:
			throwOnError: false
		});
	})
}

export const latexCss = () => `
.katex-display {
		display: inline;
		.katex {
				display: inline;
				.katex-html {
						display: inline;
				}
		}
}
`
