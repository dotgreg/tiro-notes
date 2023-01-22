
export const ssrOnClick = (query: string, action: (el: any) => void) => {
	let els = document.querySelectorAll(query) as any
	for (let i = 0; i < els.length; i++) {
		const el = els[i];
		el?.addEventListener("click", e => { action(el) })
	}
}

export const ssrOpenIframe = (elPath: string, url: string) => {
	let elWrapper: any = document.querySelector(`${elPath}`)
	let isIframeOpen = elWrapper?.querySelector(`iframe`)
	let iframeHtml = `<iframe
				src='${url}'
				title='${url}'
				allowFullScreen
				class="resource-link-iframe small-iframe"
></iframe>
`
	if (!elWrapper) return

	elWrapper.innerHTML = !isIframeOpen ? iframeHtml : ""
	if (!isIframeOpen) {
		elWrapper.classList.add("open")
	} else {
		elWrapper.classList.remove("open")
	}

	let isBig = elWrapper.classList.contains("big")

	if (!isIframeOpen) {
		elWrapper.innerHTML = iframeHtml
	}
	else if (isIframeOpen && !isBig) {
		elWrapper.classList.add("big")
	}
	else if (isIframeOpen && isBig) {
		elWrapper.classList.remove("big")
	}
}
