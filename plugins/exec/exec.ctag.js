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
				padding: 5px;
				text-align: left;
				border-collapse: collapse;
			}
			tr,td {
				padding: 1px 5px;
			}
			th {
				padding: 7px;
				background: #c1c1c1;
			}
			// align header left
			th {
				text-align: left;

			}
			// even rows
			// tr:nth-child(even) {
			// 	background: #f0f0f0;
			// }
			table tr:nth-child(odd) {
				background: #EEE;
			}
			table tr:nth-child(even) {
				background: #CCC;
			}
			td.calculation {
				color: grey;
			}
		</style> `

		api.utils.loadRessources([
				// 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.6.0/highlight.min.js',
				// 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.2.0/styles/agate.min.css',
				`${opts.plugins_root_url}/_common/common.lib.js`,
				'https://cdnjs.cloudflare.com/ajax/libs/mathjs/11.3.0/math.min.js',
				// 'https://cdnjs.cloudflare.com/ajax/libs/plotly.js/2.16.0/plotly.min.js',
		], () => {
				// MATHJS Helpers
				// window.m = (str) => math.evaluate(str).toString()

				updateContent(execExpression())
				setTimeout(() => {
						// RESIZING
						let resDiv = document.body 
						api.utils.resizeIframe(`${resDiv.clientHeight + 40}px`);
				})
		})

		const helpText = `
		<h3>Exec Ctag Help</h3>
		<p>Execute calculations in javascript and get the output in a table</p>
		<p>If some lines starts like r.aCalculation = <...>, it will appear on the result </p>
		<br>
		<h4>Math.js</h4>
		<p> Math.js is loaded in the background by calling m() (shortcut for math.compile) or math, so you can use it to perform calculations</p>
		<p> For example, you can use math.multiply([1,2,3,4,5], 2) to multiply an array</p>
		<br> please refer to the <a href="https://mathjs.org/docs/expressions/syntax.htmlhttps://mathjs.org/docs/expressions/parsing.html">math.js documentation</a> for more information
		<h4>Example</h4>
		<pre>
			[[exec]]
				t = {}
				t.a = 1
				t.b = 2
				t.c = t.a + t.b
				t.d = m( "sqrt(3^2 + 4^2)" )
				t.e = math.multiply([1,2,3,4],  3)
				return t
			[[exec]]
		</pre>
		`


		const execExpression = () => {

				try {
					window.m = (str) => math.evaluate(str).toString()
					const commonLib = window._tiroPluginsCommon.commonLib
					const { generateHelpButton, getOperatingSystem, each, onClick } = commonLib
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
						// if calculation && value = "" return
						// if ( value.length < 1) continue
						// if val is object, stringify it
						if (typeof value === 'object') {
							value = JSON.stringify(value, null, 4)
							console.log(111, value)
							// replace tab space by htmlSpace and \n by <br>
							let htmlSpace = '&nbsp;&nbsp;'
							value = value.replaceAll("    ", htmlSpace)
							value = value.replace(/\t/g, htmlSpace)
							value = value.replace(/\n/g, '<br>')
							// , => SPACE * 2 , <br>
							// value = value.replace(/,/g, ',<br>'+htmlSpace)
						}
						// replace , with ;
						if(typeof value === "string") value = value.replace(/,/g, ';')
						if (typeof calculation === "string") calculation = calculation.replace(/,/g, ';')
						t3[key] = [value, calculation]
					}


					let csvStr = ''
					// create a csv with the results
					// variable name, valyue, calculation
					csvStr += 'variable name, value, calculation\n'
					for (let key in t3) {
						csvStr += `${key},${t3[key][0]},${t3[key][1]}\n`
					}

					let lines = csvStr.split('\n')
					window.toggleCalculationVisiziility = () => {
						document.querySelectorAll('.calculation').forEach(cell => {
							cell.style.display = cell.style.display === 'none' ? 'block' : 'none'
						})
					}

					let tableAndStyleHtml = `
					<table id="table">
						<thead>
							<tr>
								<th class="variable-name">variable name</th>
								<th class="value">value</th>
								<th class="calculation">calculation</th>
							</tr>
						</thead>
						<tbody>
							${lines.slice(1).map(line => {
								// if line is empty, return empty string
								if (line.trim() === '') return ''
								let cells = `
								<td class="variable-name">${line.split(',')[0]}</td>
								<td class="value">${line.split(',')[1]}</td>
								<td class="calculation">${line.split(',')[2]}</td>
								`
								
								return `<tr>${cells}</tr>`
							}
							).join('')}
						</tbody>
					</table>
					<br>
					<a href="data:text/csv;charset=utf-8,${encodeURIComponent(csvStr)}" download="data.csv"><button> download csv</button></a>
					<button onclick="toggleCalculationVisiziility()">toggle calc</button>
					${generateHelpButton(helpText, "Exec ctag help")}
					${styleStr}
					`


					document.body.innerHTML = tableAndStyleHtml



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
