const tocApp = (innerTagStr, opts) => {
		const {div, updateContent} = api.utils.createDiv()
		const filepath = api.utils.getInfos().file.path

		// update content every x seconds
		if (!opts) opts = {}
		let refresh_interval = 5*1000
		if (opts.refresh_interval) refresh_interval = opts.refresh_interval * 1000

		const h = `[TOC CTAG]`
		console.log(h, "init TOC CTAG with refresh_interval of ", refresh_interval);
		setTimeout(() => {updateTocFromContent()})
		setInterval(() => {updateTocFromContent()}, refresh_interval )

		let prevContent = '';

		const updateTocFromContent = () => {
				api.call("file.getContent", [filepath], noteContent => {

						// dont do anything if content didnt change
						if (noteContent === prevContent) return
						prevContent = noteContent

						console.log(h, "updateTocFromContent");
						if (!noteContent) return console.warn (h, "no notecontent found for ", filepath)

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

						let resHtml = `<div class="toc-wrapper"><ol>`
						for (let i = 0; i < resArr.length; i++) {
								const o = resArr[i];
								const no = resArr[i+1];
								const jsAction = `onClick="window.jumpTo(${o.line})"`
								const sLi = `<li class="main-color">`
								const contentLi = `<a href="#" ${jsAction}>${o.title}</a>`
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
												// console.log(3333333, endOl, o.ranking, no.ranking);
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
						updateContent(resHtml);
						setTimeout(() => {
								api.utils.resizeIframe();
						}, 100)
				});
		}

		

		window.jumpTo = (lineNb) => {
				console.log("[TOC] IFRAME JUMP TO ", lineNb);
				api.call('ui.note.lineJump.jump',[{windowId: 'active', line: lineNb}])
		}
		return div 
}




window.initCustomTag = tocApp
