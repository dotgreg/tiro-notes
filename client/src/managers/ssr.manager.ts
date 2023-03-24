import { random } from "lodash"

//@ts-ignore
window.ssrActionsDic = {}

type iSSRAction = (el: any) => void
let addSsrAction = (id: number, action: iSSRAction) => {
	//@ts-ignore
	// window.ssrActionsDic[`${id}`] = action
	window.ssrActionsDic[`${id}`] = (el) => {
		action(el)
	}
}
export const createSsrAction = (el: any, action: iSSRAction): string => {
	// el?.setAttribute('onclick', `window.ssrActionsDic["${query}"]()`)
	// addSsrAction(query, action, el)
	let id = random(0, 100000000000000000)
	addSsrAction(id, action)
	let onclickString = `window.ssrActionsDic['${id}'](this)`
	console.log(onclickString);
	return onclickString
}

export const ssrOnClick = (query: string, action: (el: any) => void) => {
	let els = document.querySelectorAll(query) as any
	for (let i = 0; i < els.length; i++) {
		const el = els[i];
		// el?.addEventListener("click", e => { action(el) })
		// window.ssrActionsDic
		// addSsrAction(query, action, el)
		//@ts-ignore
		// el?.setAttribute('onclick', `window.ssrActionsDic["${query}"]()`)
	}
}


export const ssrOpenIframe = (elPath: string, url: string) => {
	return ssrOpenPreview(elPath, url, { isUrl: true })
}


export const ssrOpenPreview = (elPath: string, content: string, opt?: { isUrl?: boolean }) => {
	let elWrapper: any = document.querySelector(`${elPath}`)
	let isPreviewOpen = elWrapper?.querySelector(`iframe`)
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
