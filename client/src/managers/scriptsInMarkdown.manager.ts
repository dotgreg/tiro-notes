import { replaceCustomMdTags, replaceUserCustomMdTag } from "./markdown.manager";
import { addCliCmd } from "./cliConsole.manager";
import { each } from "lodash";
import * as _ from "lodash"

//
// LOAD EXTERNAL SCRIPTS
//
export const loadScripts = (scripts: string[], cb: Function) => {
	console.log('[CLIENT SCRIPT] loadScripts', scripts);
	let scriptsLoaded = 0;
	each(scripts, scriptToLoad => {
		const s = document.createElement('script');
		s.src = scriptToLoad
		s.onload = () => {
			scriptsLoaded++
			console.log(`[CLIENT SCRIPT]loadScripts: ${scriptsLoaded}/${scripts.length}`);
			if (scriptsLoaded === scripts.length) {
				console.log(`[CLIENT SCRIPT]loadScripts all scripts loaded, cb()!`);
				try {
					if (cb) cb()
				} catch (e) {
					console.log(`[CLIENT SCRIPT ]ERROR LoadScript Callback : ${e}`);
				}
			}
		}
		document.getElementById('preview-script-area')?.appendChild(s)
	})
}

addCliCmd('loadScripts', {
	description: `
Load scripts and css then execute the callback
==
params
	scripts: strings[] (can be external https scripts or css)
	callback?: Function
==
${loadScripts}`,
	func: loadScripts,
	f: loadScripts
})

addCliCmd('lodash', {
	description: ``,
	func: () => _,
	f: () => _
})

//
// TRANSFORM TEXT IN SCRIPTS
//
export const transformMarkdownScripts = (bodyRaw: string): string => {
	let res = replaceCustomMdTags(bodyRaw, '[[script]]', (input: string) => {
		const func = `
const toeval = function () {
${input};
}
toeval();`;
		//console.log('wooop', input, func);
		return eval(func);
	});
	return res;
};


