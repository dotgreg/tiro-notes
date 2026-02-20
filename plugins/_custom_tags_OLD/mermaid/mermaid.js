const mermaidApp = (innerTagStr, opts) => {
		const {div, updateContent} = api.utils.createDiv()
		const classId = `mermaid-${api.utils.uuid()}`
		api.utils.loadScripts(['https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js'], () => {
				updateContent(`
    <div class="${classId}">
        ${innerTagStr}
    </div>
    `)
				mermaid.initialize({});
				mermaid.init({noteMargin: 10}, `.${classId}`);
				setTimeout(() => {
						api.utils.resizeIframe()
				}, 100)
		})

		return div 
}

window.initCustomTag = mermaidApp
