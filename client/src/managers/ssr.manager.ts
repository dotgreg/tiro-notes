
export const ssrOnClick = (query: string, action: (el: any) => void) => {
	let els = document.querySelectorAll(query) as any
	for (let i = 0; i < els.length; i++) {
		const el = els[i];
		el?.addEventListener("click", e => { action(el) })
	}
}

export const ssrOpenIframe = (elPath: string, url: string) => {
	let elIframe = document.querySelector(`${elPath}`)
	let isIframeOpen = elIframe?.querySelector(`iframe`)
	let height = 400
	// let height = bigIframe ? heightIframe.big : heightIframe.small
	let iframeHtml = `<iframe
				src='${url}'
				title='${url}'
				allowFullScreen
				class="resource-link-iframe small-iframe"
></iframe>
`
	if (!elIframe) return
	elIframe.innerHTML = !isIframeOpen ? iframeHtml : ""
	if (!isIframeOpen) { elIframe.classList.add("open") }
	else { elIframe.classList.remove("open") }
	// setStatus(!isIframeOpen ? "open" : "closed")
}
