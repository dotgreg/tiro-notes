import "@fortawesome/fontawesome-free/css/all.css"
import { ssrGenCtag, ssrToggleCtag } from "./ssr/ctag.ssr"

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