const execApp = (innerTagStr, opts) => {
		const {div, updateContent} = api.utils.createDiv()

		const getHtmlWrapper = (res) => {

				let res2 = 		`
<div id="exec-result-wrapper"> 
<pre>
<code class="language-json">
${res}
</code>
</pre>
</div>

<style>
#exec-result-wrapper {
		font-weight: bold;
		padding: 3px;
		margin-left: 0px;
		width: calc(100% - 1px);
		border-radius: 5px;
}
pre code {
		font-size: 10px;
		line-height: 12px;
}
</style> `
				return res2
		}

		api.utils.loadRessources([
				// 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.6.0/highlight.min.js',
				// 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.2.0/styles/agate.min.css',
				'https://cdnjs.cloudflare.com/ajax/libs/mathjs/11.3.0/math.min.js',
				// 'https://cdnjs.cloudflare.com/ajax/libs/plotly.js/2.16.0/plotly.min.js',
		], () => {
				// MATHJS Helpers
				window.m = (str) => math.evaluate(str).toString()

				updateContent(execExpression())
				setTimeout(() => {
						// RESIZING
						let resDiv = document.getElementById("exec-result-wrapper")
						api.utils.resizeIframe(`${resDiv.clientHeight}px`);

						// HIGHLIGHTING RESULT
						// console.log(123412, hljs);
						hljs.highlightAll();
				})
		})

		const execExpression = () => {
				try {
						let resEval = Function(innerTagStr)()
						let res = JSON.stringify( resEval, undefined, 2)
						return getHtmlWrapper(res)
				}
				catch(e){
						return  getHtmlWrapper("error :"+e)
				}
		}

		setTimeout(() => {
				updateContent("exec loading...")
		})
		return div
}

window.initCustomTag = execApp
