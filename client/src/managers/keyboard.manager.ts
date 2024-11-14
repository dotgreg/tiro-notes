import * as k from 'keyboardjs';
import { getApi } from '../hooks/api/api.hook';
import { textToId } from './string.manager';
import { codeMirrorGlobalVars } from '../components/dualView/CodeMirrorEditor.component';
import { notifLog } from './devCli.manager';


export const addKeyShortcut = (shortcut: string, Fn: Function) => {
	if (!k || !k.bind) return
	k.bind(shortcut, Fn);
}

export const releaseKeyShortcut = (shortcut: string, Fn: Function) => {
	if (!k || !k.bind) return
	k.unbind(shortcut, Fn);
}

export const releaseKeyShortcuts = () => {
	if (!k || !k.bind) return
	k.releaseAllKeys();
}

export interface iKeyboardShortcut {
	shortcut: string
	func: Function
	command_name: "toggle_note" | "highlight_to_ai"
	command_content: string
}
export const loadUserKeyboardShortcuts = (configText:string):iKeyboardShortcut[] => {
	// configText looks like this:
	// shift + alt > 1 | toggle_note | /path/to/file.md
	// shift + alt > 2 | highlight_to_ai | ai_model_name
	// etc...
	// 

	const Fn_toggle_note = (notePath:string) => () => {
		getApi(api => {
			let pathFile = notePath
			let idFromPath = textToId(pathFile)
			let idPanel = `floating-panel-${idFromPath}`
			api.ui.floatingPanel.toggleFile(pathFile, {idpanel: idPanel})
		})
	}

	const Fn_highlight_to_ai = (aiModelName?:string) => () => {
			console.log("CM", codeMirrorGlobalVars, aiModelName)
			let selectedText = codeMirrorGlobalVars.lastCMSelection.selectionContent
			if (selectedText === "") selectedText = codeMirrorGlobalVars.lastCMSelection.lineContent
			if (selectedText === "") return console.warn("[highlight to ai] No text selected")
			getApi( api => {
				api.ai.search(selectedText, aiModelName)
			})
	}

	let arrayConfigRaw = configText.split("\n")
	// if one line is empty, remove it
	arrayConfigRaw = arrayConfigRaw.filter(i => i.trim() !== "")
	let arrayConfig:iKeyboardShortcut[] = arrayConfigRaw.map(line => {
		let [shortcut, command_name_raw, command_content] = line.split("|").map(i => i.trim())
		let command_name = command_name_raw as iKeyboardShortcut["command_name"]
		//
		// hydrating functions
		//
		let func = () => {
		}
		if (command_name === "toggle_note") func = Fn_toggle_note(command_content)
		else if (command_name === "highlight_to_ai") func = Fn_highlight_to_ai(command_content)
		else func = () => {notifLog(`[custom shortcuts] command not found: "${command_name}"`, "error_shortcut_id"	)}

		return {shortcut, func, command_name, command_content}
	})


	// 
	//
	//

	return arrayConfig

	
}