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
				background: #393939!important;
				color: burlywood;
				font-size: 10px;
				line-height: 12px;
				padding: 0px 11px 13px 11px!important;
				overflow: auto;
				white-space: pre-wrap;
				width: calc(100% - 50px);
		}
</style> `
				return res2
		}

		const styleStr = `
		<style>
			#exec-result-wrapper {
					font-weight: bold;
					padding: 3px;
					margin-left: 0px;
					width: calc(100% - 1px);
					border-radius: 5px;
			}
			pre code {
					background: #393939!important;
					color: burlywood;
					font-size: 10px;
					line-height: 12px;
					padding: 0px 11px 13px 11px!important;
					overflow: auto;
					white-space: pre-wrap;
					width: calc(100% - 50px);
			}
			body {
				font-family: Arial, sans-serif;
				font-size: 12px;
			}
			table, td, th {
				border: 1px solid black;
				border-collapse: collapse;
			}
			td, td {
				padding: 2px;
			}
		</style> `

		api.utils.loadRessources([
				// 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.6.0/highlight.min.js',
				// 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.2.0/styles/agate.min.css',
				'https://cdnjs.cloudflare.com/ajax/libs/mathjs/11.3.0/math.min.js',
				// 'https://cdnjs.cloudflare.com/ajax/libs/plotly.js/2.16.0/plotly.min.js',
		], () => {
				// MATHJS Helpers
				// window.m = (str) => math.evaluate(str).toString()

				updateContent(execExpression())
				setTimeout(() => {
						// RESIZING
						let resDiv = document.getElementById("exec-result-wrapper")
						api.utils.resizeIframe(`${resDiv.clientHeight}px`);
						console.log("resDiv.clientHeight", resDiv.clientHeight)

						// HIGHLIGHTING RESULT
						// hljs.highlightAll();
						// setTimeout(() => {
						// 							api.utils.resizeIframe(`${resDiv.clientHeight}px`);
						// }, 1500)
				})
		})

		const execExpression = () => {
				try {
					let varStr = innerTagStr
					let analysisArr = []
					let analysisObj = {}
					varStr.split('\n').map(line => {
						let match = line.match(/t\.(\w+)\s*=\s*(.*)/)
						if (match) {
							analysisArr.push({name: match[1], calculation: match[2]})
							analysisObj[match[1]] = match[2]
						}
					})

					t2 = new Function(varStr)()

					// for each var of t2
					let t3 = {}
					for (let key in t2) {
						let calculation = analysisObj[key] || ""
						let value = t2[key]
						// if val is object, stringify it
						if (typeof value === 'object') {
							value = JSON.stringify(value)
							// replace , with ;
							value = value.replace(/,/g, ';')
						}
						t3[key] = [value, calculation]
					}

					// console.log(t3)

					let csvStr = ''
					// create a csv with the results
					// variable name, valyue, calculation
					csvStr += 'variable name, value, calculation\n'
					for (let key in t3) {
						csvStr += `${key},${t3[key][0]},${t3[key][1]}\n`
					}


					console.log(csvStr)

					// insert it to body
					document.body.innerHTML = `<table id="table"></table> ${styleStr}`
					// create a html table with 1) the following header
					// variable name, valyue, calculation 
					// 2) the values




					let table = document.getElementById('table')
					let lines = csvStr.split('\n')
					let header = lines[0].split(',').map(cell => `<th>${cell}</th>`).join('')
					table.innerHTML = `<tr>${header}</tr>`
					lines.slice(1).map(line => {
						let cells = line.split(',').map(cell => `<td>${cell}</td>`).join('')
						table.innerHTML += `<tr>${cells}</tr>`
					})






						// let resEval = Function(innerTagStr)()

						// // if output an object, compress the array obj displayed
						// let c = resEval
						// let c2 = {}
						// for (const key in c) {
						// 		let v = c[key]
						// 		let isA = Array.isArray(v)
						// 		if (isA) {
						// 				c2[key] = "[" + v.join(", ") + "]"
						// 		} else {
						// 				c2[key] = v
						// 		}
						// }
						// resEval = c2

						// let res = JSON.stringify( resEval, undefined, 2)

						// return getHtmlWrapper(res)
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
