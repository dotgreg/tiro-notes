const tocApp = (innerTagStr, opts) => {
		const {div, updateContent} = api.utils.createDiv()
		const filepath = api.utils.getInfos().file.path

		// update content every x seconds
		if (!opts) opts = {}
		let refresh_interval = 10 // 10s by default
		// let refresh_interval = 5 // 1min by default
		if (opts.refresh_interval) refresh_interval = opts.refresh_interval 
		refresh_interval = refresh_interval * 1000
		// adds up to 1s random to force not all processes to update togethr
		const randomTime = Math.round(Math.random() * 10) * 100 
		refresh_interval = refresh_interval + randomTime

		const h = `[TOC CTAG] 1.0.4 31/08/22`
		console.log(h, "init TOC CTAG with refresh_interval of ", refresh_interval);


		/////////////////////////////////////////
		// 1. DATA MANAGEMENT
		//
		const getHtml = (disableCache, cb) => {
				const hasUserReloaded = api.utils.getInfos().reloadCounter !== 0 
				if (disableCache || hasUserReloaded) {
						// no cache
						fetchAndProcessData(cb)
				} else {
						// try cache, el
						console.log(h, "fetching from cache!");
						getCache(
								res => {cb(res)},
								() => {fetchAndProcessData(cb)}
						)
				}
		}

		/////////////////////////////////////////////////////
		// 1.1 CACHING MECHANISM
		const cacheId = `ctag-toc-${filepath}`
		const getCache = (onSuccess, onFailure) => {
				api.call("cache.get", [cacheId], content => {
						if(content !== undefined) onSuccess(content)
						else onFailure()
				})
		}
		const setCache = (content) => {
				api.call("cache.set", [cacheId, content])
		}

		/////////////////////////////////////////////////////
		// 1.2 FETCHING LOGIC
		// MAIN COLOR
		let mainColorHex = "";
		api.call("userSettings.get", ['ui_layout_colors_main'], color => {
				mainColorHex = color
		});


		let prevContent = ''
		const fetchAndProcessData = (cb) => {
				api.call("file.getContent", [filepath], noteContent => {

						// dont do anything if content didnt change
						if (noteContent === prevContent) return
						prevContent = noteContent

						console.log(h, "fetchandprocessdata");
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
								const jsAction = `onClick="event.preventDefault(); window.jumpTo(${o.line});"`
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

						const colorStyle = mainColorHex === "" ? `color:inherit;`:`color:${mainColorHex};`
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
ol li a {
		cursor: pointer;
		text-decoration: underline;
		${colorStyle}
}

.toc-wrapper p {
		margin: 0px;
		display: inline-block;
}
</style>`
						setCache(resHtml);
						cb(resHtml);
				});
		}

		/////////////////////////////////////////
		// 2. MAIN PROCESS LOGIC & TIME
		//
		setTimeout(() => {updateToc()}, randomTime)
		setInterval(() => {updateToc(true)}, refresh_interval )

		const updateToc = (disableCache=false) => {
				getHtml(disableCache, (html) => {
						updateContent(html);
						setTimeout(() => {
								api.utils.resizeIframe();
						}, 100)
				})
		}


		/////////////////////////////////////////
		// 3. FRONT LOGIC
		//
		window.jumpTo = (lineNb) => {
				const wid = api.utils.getInfos().windowId
				// const infos = api.utils.getInfos()
				// console.log("[TOC] IFRAME JUMP TO 2 ", lineNb, wid, infos);
				api.call('ui.note.lineJump.jump',[{windowId: wid, line: lineNb}])
		}
		return div 




}




window.initCustomTag = tocApp
