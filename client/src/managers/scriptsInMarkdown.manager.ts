import { replaceCustomMdTags } from "./markdown.manager";
import { each } from "lodash";

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
		const el = document.getElementById('preview-script-area')
		if (el) el.appendChild(s)
	})
}

//
// TRANSFORM TEXT IN SCRIPTS
//
export const transformMarkdownScripts = (bodyRaw: string): string => {
	let res = replaceCustomMdTags(
		bodyRaw,
		'[[script]]',

		(UNSAFE_user_script: string) => {
			try {
				// using Function instead of eval to isolate the execution scope
				return new Function(`"use strict";  ${UNSAFE_user_script}`)()
			} catch (e: any) {
				console.log(`[SCRIPT IN MD] error: ${e}`)
			}
		});
	return res;
};


