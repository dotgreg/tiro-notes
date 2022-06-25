const tocApp = (innerTagStr, opts) => {
		// get file address
		// get file content
		// search for all the "+# " in big array + LINE JUNP!
		// create ordered object
		// render ordered object
		// MISSING : API line jump 
		// => PB: how to find right editor => from id? 

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

window.initCustomTag = tocApp
