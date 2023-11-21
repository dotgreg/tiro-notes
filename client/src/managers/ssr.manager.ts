import "@fortawesome/fontawesome-free/css/all.css"
import { iFile } from "../../../shared/types.shared"
import { getApi } from "../hooks/api/api.hook"

//
// SSR ICON SYSTEM (for better perfs)
export const ssrIcon = (icon: string): string => {
	let html = `<i class="ssr-icon fa-solid fa-${icon}"></i>`
	return html
}

//
// SSR ACTIONS
//@ts-ignore
window.ssrActionsDic = {}

type iSSRAction = (el: any) => void

export const ssrFn = (id: string, action: iSSRAction): string => {
	let onclickString = `window.ssrActionsDic['${id}'](this)`
	//@ts-ignore
	let dic = window.ssrActionsDic
	if (!dic[id]) {
		// console.log("SSR ACTION INIT", id, action);
		dic[id] = (el) => {
			action(el)
		}
	}
	return onclickString
}

export const ssrOnClick = (query: string, action: (el: any) => void) => {
	let els = document.querySelectorAll(query) as any
	for (let i = 0; i < els.length; i++) {
		const el = els[i];
		el?.addEventListener("click", e => { action(el) })
	}
}


//
// JS PURE SSR LOGIC
//
//
// CACHING
//

export type ssrCachedStatus = "open" | "closed"
export const setSsrStatus = (file:iFile, idDoc:string, status: ssrCachedStatus) => {
	let cacheId = `ressource-preview-status-${file.path}`
	let idRess = `${file.path}-${idDoc}`
	getApi(api => {
		api.cache.get(cacheId, res => {
			if (!res) res = {}
			res[idRess] = status
			api.cache.set(cacheId, res, -1)
		})
	})
}
export const getSsrStatus = (file:iFile, idDoc:string, cb: (status: ssrCachedStatus) => void) => {
	let cacheId = `ressource-preview-status-${file.path}`
	let idRess = `${file.path}-${idDoc}`
	getApi(api => {
		api.cache.get(cacheId, res => {
			if (!res) return
			let r = res[idRess] ? res[idRess] : "closed"
			cb(r)
		})
	})
}
export const atSsrStartupCheckIfOpen = (file:iFile, link:string, onOpen:Function) => {
	getSsrStatus(file, link, r => {
		if (r === "open") {
			setTimeout(() => {
				onOpen()
			}, 500)
		}
	})
}
