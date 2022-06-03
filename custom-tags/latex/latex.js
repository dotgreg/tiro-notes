const latexApp = (innerTagStr, opts) => {
		const {div, updateContent} = api.utils.createDiv()
		const classId = `katex-${api.utils.uuid()}`
		api.utils.loadScripts(['https://cdn.jsdelivr.net/npm/katex@0.15.2/dist/katex.min.js'], () => {
				katex = window.katex
				console.log(444, katex)
				const renderedLatex = katex.renderToString(`${innerTagStr}`)
				updateContent(`
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.15.2/dist/katex.css" crossorigin="anonymous"/>\n
    <div class="${classId}">
        ${renderedLatex}
    </div>
    `)
				setTimeout(() => { api.utils.resizeIframe() }, 100)
		})

		return div 
}

window.initCustomTag = latexApp
