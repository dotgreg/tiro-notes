const tocApp = (innerTagStr, opts) => {
		// get file address
		// get file content
		// search for all the "+# " in big array + LINE JUNP!
		// create ordered object
		// render ordered object
		// MISSING : API line jump 
		// => PB: how to find right editor => from id? 
		// => SOL : listen in editorArea on that id, if thats the case update pos
		// => PB2:  doit etre fait sur 1) monaco 2) textarea
		// est-ce possible deplacer curseur textarea? => txtarea.selectionEnd= end + 7;

		const {div, updateContent} = api.utils.createDiv()
		// const classId = `mermaid-${api.utils.uuid()}`
		// api.utils.loadScripts(['https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js'], () => {
		// 		updateContent(`
    // <div class="${classId}">
    //     ${innerTagStr}
    // </div>
    // `)
		// 		mermaid.initialize({});
		// 		mermaid.init({noteMargin: 10}, `.${classId}`);
		// 		setTimeout(() => {
		// 				api.utils.resizeIframe()
		// 		}, 100)
		// })
		const filepath = api.utils.getInfos().file.path
		// const windowId = api.utils.getInfos().frameId
		api.call("file.getContent", [filepath], noteContent => {
				// V1
				// updateContent(`hello toc toc ${noteContent.length}`)
				// // get titles
				// const matches = noteContent.match(/([#]{1,9}\ (.+))/gi)
				// console.log(matches);
				// const		res = []
				// for (let i = 0; i < matches.length; i++) {
				// 		const el = matches[i];
				// 		// get line
				// 		const contentToSeach = res.length > 0 ? noteContent.split("\n").slice(res[res.length-1].line).join("\n") : noteContent;
				// 		res.push({raw: el, line: contentToSeach.indexOf(el)})

				// }
				// console.log(res);
				// console
				// for each match, get its corresponding line
				// ['# Title 1', '## SUb1', '## SUb2', '# title 2', '## sub21', '## sub22', '## sub221', '## sub222']
				
				// ['# another', '## another 1', '### another 11', '### another 12', '### another 13', '## another 2', '## another 3', '### another 31', '#### another 311', '#### another 312', '#### another 313', '### another 32', '### another 33', '#### another 331', '#### another 332', '#### another 333', '# Title 1', '## SUb1', '## SUb2', '# title 2', '## sub21', '## sub22', '## sub221', '## sub222']0: "# another"1: "## another 1"2: "### another 11"3: "### another 12"4: "### another 13"5: "## another 2"6: "## another 3"7: "### another 31"8: "#### another 311"9: "#### another 312"10: "#### another 313"11: "### another 32"12: "### another 33"13: "#### another 331"14: "#### another 332"15: "#### another 333"16: "# Title 1"17: "## SUb1"18: "## SUb2"19: "# title 2"20: "## sub21"21: "## sub22"22: "## sub221"23: "## sub222"length: 24[[Prototype]]: Array(0)

				// const obj = {}
				// const recursOrgStruct = (currStr, obj) => {

				// } 

				// for (let i = 0; i < matches.length; i++) {
				// 		const el = matches[i];

				
				// }





				/////////////////////////////// V3

				const lines = noteContent.split("\n")
				const resArr = []
				let cnt = 0;
				for (let i = 0; i < lines.length; i++) {
						const line = lines[i]
						const matches = [...line.matchAll(/([#]{1,9})\ (.+)/gi)];
						if (matches.length>0) {
								const m = matches[0]
								resArr.push({raw: line, matches:m, line:i, title: m[2], ranking:m[1].length})
						}
				}
				console.log(resArr);



				let resHtml = `<div class="toc-wrapper"><ol>`
				for (let i = 0; i < resArr.length; i++) {
						const o = resArr[i];
						const no = resArr[i+1];
						const jsAction = `onClick="window.jumpTo(${o.line})"`
						const sLi = `<li class="main-color">`
						const contentLi = `<p ${jsAction}>${o.title}</p>`
						const eLi = `</li>`
						if (no) {
								// if next one exists
								// bigger rank, means i am a parent
								if (no.ranking > o.ranking) resHtml += `${sLi} ${contentLi} <ol>`
								//  same rank, means i am a child
								else if (no.ranking === o.ranking) resHtml += `${sLi} ${contentLi} ${eLi}`
								//  smaller rank, means i am the last child
								else if (no.ranking < o.ranking) {
										// calc the nb of </ol> to render
										let endOl = ''
										for (let i = 0; i < o.ranking - no.ranking; i++) {endOl += "</ol>"}
										console.log(3333333, endOl, o.ranking, no.ranking);
										resHtml += `${sLi} ${contentLi} ${eLi} ${endOl} ${eLi}`
								}
						} else {
								// else i am the last child
								resHtml += `${sLi} ${contentLi} ${eLi} </ol> ${eLi}`
						}
						
				}
				resHtml += `</ol></div>`
				resHtml += `<style>
ol { counter-reset: item }
li { display: block }
li:before { content: counters(item, ".") " "; counter-increment: item }

.toc-wrapper {
  
}
ol {
		margin: 0px;
		padding: 0px;
		padding-left: 10px;
}
ol li p {
		cursor: pointer;
		text-decoration: underline;
}
.toc-wrapper p {
		margin: 0px;
		display: inline-block;
}
</style>`
				console.log(resHtml);
				updateContent(resHtml)
		})

		window.jumpTo = (lineNb) => {
				console.log("IFRAME JUMP TO ", lineNb);
				api.call('ui.note.lineJump.jump',[{windowId: 'active', line: lineNb}])
		}
		return div 
}




window.initCustomTag = tocApp
