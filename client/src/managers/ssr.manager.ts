//
// SSR ICON SYSTEM (for better perfs)
//
import "@fortawesome/fontawesome-free/css/all.css"
import { ssrToggleIframeCtag } from "./ssr/ctag.ssr"

export const ssrIcon = (icon: string): string => {
	let html = `<i class="ssr-icon fa-solid fa-${icon}"></i>`
	return html
}

export const iconSSRCss = () => `
`



//
// SSR ACTIONS
//
//@ts-ignore
window.ssrActionsDic = {}

type iSSRAction = (el: any) => void
let addSsrAction = (action: iSSRAction) => {
	//@ts-ignore
	// window.ssrActionsDic[`${id}`] = action
	window.ssrActionsDic[`audio`] = (el) => {
		action(el)
	}
}

export const ssrFn = (id: string, action: iSSRAction): string => {
	// el?.setAttribute('onclick', `window.ssrActionsDic["${query}"]()`)
	// addSsrAction(query, action, el)
	// let id = random(0, 100000000000000000)
	// addSsrAction(id, action)
	let onclickString = `window.ssrActionsDic['${id}'](this)`

	//@ts-ignore
	let dic = window.ssrActionsDic
	if (!dic[id]) {
		// console.log("SSR ACTION INIT", id, action);
		dic[id] = (el) => {
			action(el)
		}
	}

	// console.log(onclickString);
	return onclickString
}

export const ssrOnClick = (query: string, action: (el: any) => void) => {
	let els = document.querySelectorAll(query) as any
	for (let i = 0; i < els.length; i++) {
		const el = els[i];
		el?.addEventListener("click", e => { action(el) })
		// window.ssrActionsDic
		// addSsrAction(query, action, el)
		//@ts-ignore
		// el?.setAttribute('onclick', `window.ssrActionsDic["${query}"]()`)
	}
}




//
// OPENING IFRAME PREVIEW
//

// NEW 2 EL+CTAG IFRAME
export const ssrOpenIframeEl2 = (el: any, url: string, opts?: { fullscreen?: boolean }) => ssrOpenPreviewEl2(el, url, { isUrl: true, fullscreen: opts?.fullscreen })

const ssrOpenPreviewEl2 = (elWrapper: any, content: string, opt?: { isUrl?: boolean, fullscreen?: boolean }) => {
	ssrToggleIframeCtag(elWrapper, content, opt?.fullscreen || false)
}

// NEW EL BASED
export const ssrOpenIframeEl = (el: any, url: string) => ssrOpenPreviewEl(el, url, { isUrl: true })


// OLD PATH BASED
export const ssrOpenIframe = (elPath: string, url: string) => ssrOpenPreview(elPath, url, { isUrl: true })

export const ssrOpenPreview = (elPath: string, content: string, opt?: { isUrl?: boolean }) => {
	let elWrapper: any = document.querySelector(`${elPath}`)
	return ssrOpenPreviewEl(elWrapper, content, opt)
}

//
// INT
//

const ssrOpenPreviewEl = (elWrapper: any, content: string, opt?: { isUrl?: boolean }) => {
	let isPreviewOpen = elWrapper.querySelector(`iframe`)
	let previewHtml = ""

	if (opt?.isUrl) {
		let url = content
		previewHtml = `<iframe
				src='${url}'
				title='${url}'
				allowFullScreen
				class="resource-link-iframe small-iframe"
				></iframe>`

	} else {
		// previewHtml = `<div class="resource-link-iframe small-iframe">${content}</div>`
		content = content.replaceAll('"', '\'')
		previewHtml = `<iframe
				srcdoc="${contentStyle}${content}"
				allowFullScreen
				class="resource-link-iframe small-iframe"
				></iframe>`

	}

	if (!elWrapper) return

	elWrapper.innerHTML = !isPreviewOpen ? previewHtml : ""
	if (!isPreviewOpen) {
		elWrapper.classList.add("open")
	} else {
		elWrapper.classList.remove("open")
	}

	let isBig = elWrapper.classList.contains("big")

	if (!isPreviewOpen) {
		elWrapper.innerHTML = previewHtml
	}
	else if (isPreviewOpen && !isBig) {
		elWrapper.classList.add("big")
	}
	else if (isPreviewOpen && isBig) {
		elWrapper.classList.remove("big")
	}
}

const contentStyle = `
<style>
img {
		max-width: 100%!important;
		height: auto!important;
}
body, html {
		font-family: sans-serif;
}
</style>
`
