//
// Testing Fn Live

import { getApi } from "../hooks/api/api.hook"

//
const windowNS = "tiroDevCli"
export const devCliAddFn = (cat: string, name: string, fn: Function) => {
	// console.log("[TIRO DEV CLI] adding ", cat, name)
	//@ts-ignore
	if (!window[windowNS]) window[windowNS] = {}
	//@ts-ignore
	if (!window[windowNS][cat]) window[windowNS][cat] = {}
	//@ts-ignore
	window[windowNS][cat][name] = fn
}
export const devCliGetFn = (cat: string, name: string): Function => {
	//@ts-ignore
	return (window[windowNS] && window[windowNS][cat] && window[windowNS][cat][name]) ? window[windowNS][cat][name] : () => { 
		console.log("DEV FN", cat, name, "does not exists") 
	}
}
export const devCliExecFn = (cat: string, name: string) => {
	//@ts-ignore
	if (window[windowNS] && window[windowNS][cat] && window[windowNS][cat][name]) {
		window[windowNS][cat][name]()
	}  else {
		let err = `DEV FN ${cat} ${name} does not exists`
		console.log(err)
		notifLog(err)
	} 
}

let h = `[DEV HOOK]`
export const devHook = (id: string) => (...p) => {
	//@ts-ignore	
	if (!window[windowNS]) window[windowNS] = {}
	//@ts-ignore	
	if (!window[windowNS]["_hooks"]) window[windowNS]["_hooks"] = {}
	if (!window[windowNS]["_hooks"][id]) window[windowNS]["_hooks"][id] = null
	//@ts-ignore	
	let exists = window[windowNS]["_hooks"][id]
	if(exists) {
		try {
			console.log(h, `triggering dev hook ${id} (exi:${exists ? 1:0}) with params`,{p})
			window[windowNS]["_hooks"][id]({...p, id:id})
		} catch (error) {
			console.warn(h, error)
		}
		
	} else {
		
	}
}


//
// DEV LOG FRONT WITH NOTIFICATION
// 
//devCliAddFn()

export const notifLog = (str, id?:string, hideAfter?: number) => {
	console.log("[NOTIF LOG]: ", str)
	if (!hideAfter) hideAfter = 60
	// remove \ from string
	str = str.replace(/\\/g, "")
	getApi(api => {
		api.ui.notification.emit({content: str,id, options:{ hideAfter, type:"warning", keepInHistory: true}})
	})
}
