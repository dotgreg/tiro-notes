
const epubV2App = (innerTagStr, opts) => {

	

		
		////////////////////////////////////
		//
		// 1) CREATE HTML
		//
		//


		let style = `
			<style>


			body {
				// height:calc(100vh - 40px);
				height: 200px;
			}
			#search-results-list {
				max-height: 300px;
				display:none;
  overflow: scroll;
  padding: 20px 40px;
  list-style: disclosure-closed;
  background: rgba(0,0,0,0.6);
  border-radius: 9px;
  width: calc(100% - 30px);
  font-size: 12px;
			}
			
			.toolbar{

			}

			#content-wrapper {
			}
			:root {
				--active-bg: #0000000d;
			  }
			  
			  @supports (color-scheme: light dark) {
				@media (prefers-color-scheme: dark) {
				  :root {
					--active-bg: #ffffff1a;
				  }
				}
			  }
			  
			  html {
				height: 100%;
			  }
			  
			  body {
				height: 100%;
				font: menu;
				margin: 0 auto;
				font-family: system-ui, sans-serif;
			  }
			  
			  #drop-target {
				text-align: center;
				visibility: hidden;
				justify-content: center;
				align-items: center;
				height: 100vh;
				display: flex;
			  }
			  
			  #drop-target h1 {
				font-weight: 900;
			  }
			  
			  #file-button {
				font: inherit;
				cursor: pointer;
				background: none;
				border: 0;
				padding: 0;
				text-decoration: underline;
			  }
			  
			  .icon {
				fill: none;
				stroke: currentColor;
				stroke-width: 2px;
				display: block;
			  }
			  
			  .empty-state-icon {
				margin: auto;
			  }
			  
			  .toolbar {
				box-sizing: border-box;
				z-index: 1;
				visibility: hidden;
				justify-content: space-between;
				align-items: center;
				width: calc(100% );
				height: 48px;
				padding: 6px;
				transition: opacity .25s;
				display: flex;
				position: absolute;
			  }
			  
			  .toolbar button {
				color: graytext;
				background: none;
				border: 0;
				border-radius: 6px;
				padding: 3px;
			  }
			  
			  .toolbar button:hover {
				color: currentColor;
				background: #0000001a;
			  }
			  
			  #header-bar {
				top: 0;
			  }
			  
			  #nav-bar {
				bottom: 40px;
			  }
			  
			  #progress-slider {
				visibility: hidden;
				flex-grow: 1;
				margin: 0 12px;
			  }
			  
			  #side-bar {
				visibility: hidden;
				box-sizing: border-box;
				z-index: 2;
				color: canvastext;
				background: canvas;
				flex-direction: column;
				width: 320px;
				height: 100%;
				transition: visibility 0s linear .3s, transform .3s;
				display: flex;
				position: absolute;
				top: 0;
				left: 0;
				transform: translateX(-320px);
				box-shadow: 0 0 0 1px #0003, 0 0 40px #0003;
			  }
			  
			  #side-bar.show {
				visibility: visible;
				transition-delay: 0s;
				transform: translateX(0);
			  }
			  
			  #dimming-overlay {
				visibility: hidden;
				z-index: 2;
				opacity: 0;
				background: #0003;
				width: 100%;
				height: 100%;
				transition: visibility 0s linear .3s, opacity .3s;
				position: fixed;
				top: 0;
				left: 0;
			  }
			  
			  #dimming-overlay.show {
				visibility: visible;
				opacity: 1;
				transition-delay: 0s;
			  }
			  
			  #side-bar-header {
				border-bottom: 1px solid #0000001a;
				align-items: center;
				padding: 1rem;
				display: flex;
			  }
			  
			  #side-bar-cover {
				background: #d3d3d3;
				border: 0;
				border-radius: 3px;
				height: 10vh;
				min-height: 60px;
				max-height: 180px;
				margin-inline-end: 1rem;
				box-shadow: 0 0 1px #0000001a, 0 0 16px #0000001a;
			  }
			  
			  #side-bar-cover:not([src]) {
				display: none;
			  }
			  
			  #side-bar-title {
				font-size: inherit;
				margin: .5rem 0;
			  }
			  
			  #side-bar-author {
				color: graytext;
				margin: .5rem 0;
				font-size: small;
			  }
			  
			  #toc-view {
				padding: .5rem;
				overflow-y: scroll;
			  }
			  
			  #toc-view li, #toc-view ol {
				margin: 0;
				padding: 0;
				list-style: none;
			  }
			  
			  #toc-view a, #toc-view span {
				border-radius: 6px;
				margin: 2px 0;
				padding: 8px;
				display: block;
			  }
			  
			  #toc-view a {
				color: canvastext;
				text-decoration: none;
			  }
			  
			  #toc-view a:hover {
				background: var(--active-bg);
			  }
			  
			  #toc-view span {
				color: graytext;
			  }
			  
			  #toc-view svg {
				fill: canvastext;
				cursor: default;
				opacity: .5;
				margin-inline-start: -24px;
				padding-inline: 5px 6px;
				transition: transform .2s;
			  }
			  
			  #toc-view svg:hover {
				opacity: 1;
			  }
			  
			  #toc-view [aria-current] {
				background: var(--active-bg);
				font-weight: bold;
			  }
			  
			  #toc-view [aria-expanded="false"] svg {
				transform: rotate(-90deg);
			  }
			  
			  #toc-view [aria-expanded="false"] + [role="group"] {
				display: none;
			  }
			  
			  .menu-container {
				position: relative;
			  }
			  
			  .menu, .menu ul {
				margin: 0;
				padding: 0;
				list-style: none;
			  }
			  
			  .menu {
				visibility: hidden;
				color: canvastext;
				cursor: default;
				background: canvas;
				border-radius: 6px;
				padding: 6px;
				position: absolute;
				right: 0;
				box-shadow: 0 0 0 1px #0003, 0 0 16px #0000001a;
			  }
			  
			  .menu.show {
				visibility: visible;
			  }
			  
			  .menu li {
				padding: 6px 12px;
				border-radius: 6px;
				padding-left: 24px;
			  }
			  
			  .menu li:hover {
				background: var(--active-bg);
			  }
			  
			  .menu li[aria-checked="true"] {
				background-image: url("data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%2212%22%20r%3D%223%22%2F%3E%3C%2Fsvg%3E");
				background-position: 0;
				background-repeat: no-repeat;
			  }
			  
			  .popover {
				color: canvastext;
				background: canvas;
				border-radius: 6px;
				box-shadow: 0 0 0 1px #0003, 0 0 16px #0000001a, 0 0 32px #0000001a;
			  }
			  
			  .popover-arrow-down {
				fill: canvas;
				filter: drop-shadow(0 -1px #0003);
			  }
			  
			  .popover-arrow-up {
				fill: canvas;
				filter: drop-shadow(0 1px #0003);
			  }
			.exec-ctag {
				display: flex;
			}
			</style>
		`

		const injectHtmlBeforeJs = () => {
			let apphtml = `
			<div id="native-reader-bar-wrapper" >
				<input type="file" id="file-input" hidden="">
					<div id="drop-target" class="filter">
						<div>
							<svg class="icon empty-state-icon" width="72" height="72" aria-hidden="true">
								<path d="M36 18s-6-6-12-6-15 6-15 6v42s9-6 15-6 12 6 12 6c4-4 8-6 12-6s12 2 15 6V18c-6-4-12-6-15-6-4 0-8 2-12 6m0 0v42"></path>
							</svg>
							<h1>Drop a book here!</h1>
							<p>Or <button id="file-button">choose a file</button> to open it.</p>
						</div>
					</div>
					<div id="dimming-overlay" aria-hidden="true"></div>
					<div id="side-bar">
						<div id="side-bar-header">
							<img id="side-bar-cover">
							<div>
								<h1 id="side-bar-title"></h1>
								<p id="side-bar-author"></p>
							</div>
						</div>
						<div id="toc-view"></div>
					</div>
					<div id="header-bar" class="toolbar" class="config-wrapper">
						<button id="side-bar-button" aria-label="Show sidebar">
							<svg class="icon" width="24" height="24" aria-hidden="true">
								<path d="M 4 6 h 16 M 4 12 h 16 M 4 18 h 16"></path>
							</svg>
						</button>
						<div id="menu-button" class="menu-container">
							<button aria-label="Show settings" aria-haspopup="true">
								<svg class="icon" width="24" height="24" aria-hidden="true">
									<path d="M5 12.7a7 7 0 0 1 0-1.4l-1.8-2 2-3.5 2.7.5a7 7 0 0 1 1.2-.7L10 3h4l.9 2.6 1.2.7 2.7-.5 2 3.4-1.8 2a7 7 0 0 1 0 1.5l1.8 2-2 3.5-2.7-.5a7 7 0 0 1-1.2.7L14 21h-4l-.9-2.6a7 7 0 0 1-1.2-.7l-2.7.5-2-3.4 1.8-2Z"></path>
									<circle cx="12" cy="12" r="3"></circle>
								</svg>
							</button>
						</div>
					</div>
					<div id="nav-bar" class="toolbar">
						<button id="left-button" aria-label="Go left">
							<svg class="icon" width="24" height="24" aria-hidden="true">
								<path d="M 15 6 L 9 12 L 15 18"></path>
							</svg>
						</button>
						<input id="progress-slider" type="range" min="0" max="1" step="any" list="tick-marks">
						<datalist id="tick-marks"></datalist>
						<button id="right-button" aria-label="Go right">
							<svg class="icon" width="24" height="24" aria-hidden="true">
								<path d="M 9 6 L 15 12 L 9 18"></path>
							</svg>
						</button>
					</div>
			</div>
			<div id="tiro-bar-wrapper" ></div>
			<div id="tiro-invisible-bars-wrapper" > </div>
			<div id="tiro-invisible-header-bar1" > </div>
			<div id="tiro-invisible-header-bar2" > </div>
			<div id="tiro-invisible-square-back" > </div>
			<div id="tiro-indexing-overlay" style="display:none;"> initial text indexing, please wait... </div>
			
			`

				try {
					// window.document.body.innerHTML = apphtml + style
					let el=window.document.getElementById("content-wrapper")
					el.innerHTML = apphtml 
					
				}
				catch(e){
						return e 
				}
		}



















		////////////////////////////////////
		//
		// 2) CODE WHEN EPUB LIB IS LOADED
		//
		//
		const helpText = `
		<h3>Ebook Reader Help</h3>
		<p><b> To add a form popup add the formId to epub config: </b>  api.utils.loadCustomTag(epub2.ctag.js", ..., {size: "100%", padding: false, formId:"date test"})  </p>
		
		`
		let h = "[EPUB V2]"

		const onEpubLibLoaded = (readerApi) => {
			console.log("EPUB LIB v4 LOADED success", readerApi)

			const commonLib = window._tiroPluginsCommon.commonLib
			const { getLs, setLs, notifLog,  getCache, setCache, searchNote, generateHelpButton, getOperatingSystem, each, onClick } = commonLib


			let styleBar = `
			<style>
			#search-ui {
				padding: 5px 0px; 
			}
			.helpButton {
				color: white;
			}
			#header-bar {
				z-index:3;
			}
			#native-reader-bar-wrapper .toolbar {
				z-index:4;
			}
			#tiro-invisible-header-bar2 {
				height:70px;
  bottom: 32px;
  left: 50px;
  z-index: 2;
			}
			#tiro-invisible-header-bar1 {
  top: 0px;
  left: 50px;
  height: 40px;
  z-index: 4;
			}
			#tiro-invisible-header-bar2, 
			#tiro-invisible-header-bar1 {
  position: absolute;
  width: calc(100% - 100px);
  background: #ff000024;
			}
			#tiro-invisible-square-back {
  width: calc(100% - 140px);
  height: calc(100% - 140px);
  background: rgba(0,0,0,0.7);
  position: absolute;
  z-index: 2;
  top: 40px;
  left: 70px;
			}

			#menu-button ul.menu {
				z-index: 3;
			}
			
			#tiro-bar-wrapper button {
				margin: 5px 0px;
			}
			#native-reader-bar-wrapper #side-bar{
				z-index: 6;
			}
			#native-reader-bar-wrapper #dimming-overlay {
				z-index: 5;
			}
			#tiro-bar-wrapper {
				padding: 20px;
				color: white;
				position: absolute;
				top: 40px;
				left: 70px;
				width: calc(100% - 230px);
				z-index: 3;
			}
			#bar-next-txt, #bar-prev-txt {
				position: absolute;
				top: 50%;
				left: 50%;

			}
			#bar-next, #bar-prev {
				position: absolute;
				top: 0;
				padding: 10px;
				font-weight: bold;
				top: 40px;
				width: 50px;
				height: calc(100% - 160px);
				background: rgba(0,0,0,0.75);
				z-index: 2;
			}
			#bar-next {
				right: 0;
			}
			#tiro-indexing-overlay {
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				background: rgba(255,255,255,0.8);
				z-index: 10000;
				text-align: center;
				padding-top: 100px;
			}

			</style>
			`
			//
			// INVISIBLE BARS ACTIONS
			//
			let orderBars = "normal" // inverted
			window.tiro_goNext = () => {
				if (orderBars === "normal") tiroReaderApi.next()
				else tiroReaderApi.prev()
			}
			window.tiro_goPrev = () => {
				if (orderBars === "normal") tiroReaderApi.prev()
				else tiroReaderApi.next()
			}

			let invWrapper = window.document.getElementById("tiro-invisible-bars-wrapper")
			invWrapper.innerHTML = `
			<div id="bar-next" class="invisible-bar" onclick="tiro_goNext()"><button id="bar-next-txt">></button></div>
			<div id="bar-prev" class="invisible-bar" onclick="tiro_goPrev()"><button id="bar-prev-txt"><</button></div>
			`



			let buttonToggleOrderHtml = `<button id="toggle-order" onclick="tiro_toggleOrder()"> < > Direction Buttons</button>`
			window.tiro_toggleOrder = () => {
				orderBars = orderBars === "normal" ? "inverted" : "normal"

				nextEl = window.document.getElementById("bar-next-txt")
				nextEl.innerHTML = orderBars === "normal" ? ">" : "<"
				prevEl = window.document.getElementById("bar-prev-txt")
				prevEl.innerHTML = orderBars === "normal" ? "<" : ">"
				
				console.log(h, "orderBars", orderBars)
			}






			//
			//
			//
			// TTS LOGIC 
			//
			//
			//
			window.isTts = false

			// Check every 5s IF tts is working
			// if it is, check tts position, search the read text
			// if search returns an occurence, jump to that occurence page
			// UPDATING IT EVERY MIN ONLY AS VERY INTENSIVE PROCESS FOR BIG BOOKS
			window.isSearchingForTTS = false

			setTimeout(() => {
				tiroReaderApi.getAllText(fullText => {
					let secondsIntervalCheck = Math.round(fullText.length / 50000) 
					if (secondsIntervalCheck < 5) secondsIntervalCheck = 5
					console.log(h,` TTS position back to ebook reader pos > the text is ${fullText.length} characters long, checking tts every ${secondsIntervalCheck} seconds`)
					setInterval(() => {
						if (!window.isTts) return
						// api.call("ui.textToSpeechPopup.getStatus", ['hello'], (ttsInfos) => {
						api.call("ui.textToSpeechPopup.getStatus", [], (ttsInfos) => {
								if (!ttsInfos.isPlaying) return
								let textRead = ttsInfos.currentText
								if (window.isSearchingForTTS) return
								window.isSearchingForTTS = true
								console.log(h,`searching the text and jumping to it`, textRead, {ttsInfos});
								tiroReaderApi.search(textRead, cfis => { 
									window.isSearchingForTTS = false
									tiroReaderApi.goToCFI(cfis[0].cfi, true) 
								}, {firstOnly:true})
						})
					}, secondsIntervalCheck * 1000)
				})
			}, 1000)

			let buttonTTs = `<button id="tts-button" onclick="tiro_tts()"> ♫ Voice </button>`
			window.tiro_tts = () => {
				tiroReaderApi.getAllText(fullText => {
					let pagetext = tiroReaderApi.getCurrentPageText()
					window.isTts = true
					let file = api.utils.getInfos().file;
					console.log(h, "TTS fullText", fullText.length, "pagetext", pagetext.length, "file", file.name, "fileId", file.id)
					api.call("ui.textToSpeechPopup.open", [ fullText, {id: file.name, startString: pagetext}], () => {})
				})
			}

			let fullscreenBtn = `<button id="fullscreen-button" onclick="tiro_fullscreen()"> ⛶ Fullscreen </button>`
			window.tiro_fullscreen = () => {
				let file = api.utils.fullscreenIframe()
			}


			let openFormBtn = `<button id="open-form-button" onclick="tiro_openForm()"> Open Form </button>`
			if (!opts.formId) openFormBtn = ``
			window.tiro_openForm = () => {
				// if opts.formId does not exists, return an error
				let formId = opts.formId;
				if (!formId) {
					console.error(h, "No formId found, please add formId inside epub.md parameters linking to the right form id");
					return;
				} 
				api.call("popup.form.open", [formId], answer => {
					console.log("done")
				})
			}

			//
			//
			//
			// jump position hist 
			//
			//
			//
			// 2 buttons next/prev 
			let positionUI = `
			<span id="position-ui" >
				position:
				<button id="pos-next"  onclick="tiro_jump_pos(1)"> ↩ </button>
				<button id="pos-prev"  onclick="tiro_jump_pos(-1)"> ↪ </button>
			</span>`
			window.tiro_position = {
				allPositions: [],
				currentPosition: null,
			}
			window.tiro_jump_pos = (diff) => {
				let v = window.tiro_position
				// console.log(h, "jumping position", diff, v.currentPosition, v.allPositions)
				if (v.allPositions.length === 0) return
				// diff -1 / 1
				v.currentPosition += diff
				if (v.currentPosition < 0 ) { v.currentPosition = v.allPositions.length - 1 }
				if (v.currentPosition >= v.allPositions.length) { v.currentPosition = 0 }
				let pos = v.allPositions[v.currentPosition]
				console.log(h, "jumping to position", pos)
				tiroReaderApi.goTo(pos.chapter, pos.fractionChapter)
			}


			//
			//
			//
			// SEARCH LOGIC UI
			//
			//
			//
			// input text + button search + prev + next  buttons
			let searchUI = `
			<div id="search-ui" >
				<input type="text" id="search-input" placeholder="Search in book..."  /> <br>
				<button id="search-button" onclick="search_do_search()"> 🔎 </button>
				<button id="search-prev" onclick="search_prev()"> < </button>
				<button id="search-next" onclick="search_next()"> > </button>
				<span id="search-index-str" class="search-index-str"></span>
				<ul id="search-results-list" class="search-results-list"></ul>
			</div>
			`
			window.search_vars = {
				resultsNb: 0,
				results: [],
				timeSearch: 0

			}
			window.search_search_internal = (searchee, direction) => {
			}
			// do the search, reset id and results
			window.search_do_search = () => {
				let searchee = window.document.getElementById("search-input").value
				// 
				
				let startTime = new Date().getTime()
				
				let el = window.document.getElementById("search-index-str")
				el.innerHTML = `Searching for "${searchee}"...`

				let listEl = window.document.getElementById("search-results-list") 
				tiroReaderApi.search(searchee, cfis => { 
					if (cfis.length === 0) {
						el.innerHTML = `No results found for "${searchee}"`
						listEl.innerHTML = ""

					} else  {
						window.search_vars.index = 0
						window.search_vars.results = cfis
						tiroReaderApi.goToCFI(cfis[0].cfi) 
						window.search_vars.timeSearch = Math.round((new Date().getTime() - startTime)/ 1000)
						window.search_update_indexStr()
						// UPDATE LISTE
						listEl.innerHTML = ""
						listEl.style.display = "block"
						for (let i = 0; i < cfis.length; i++) {
							let res = cfis[i]
							let li = window.document.createElement("li")
							li.innerHTML = `<span class="search-result-cfi">${res.extract}<span/>`
							li.addEventListener("click", () => {
								tiroReaderApi.goToCFI(res.cfi)
								window.search_vars.index = i
								window.search_update_indexStr()
							})
							listEl.appendChild(li)
						}
					}
				})
			}
			window.search_goto = (diff) => {
				v = window.search_vars
				if (v.results.length === 0) return
				// diff -1 / 1
				v.index += diff
				if (v.index < 0 ) { 
					v.index = v.results.length - 1 
				}
				if (v.index >= v.results.length) { v.index = 0 }

				tiroReaderApi.goToCFI(v.results[v.index].cfi)
				window.search_update_indexStr()

			}
			window.search_update_indexStr = () =>  {
				// 2 / 10
				let el = window.document.getElementById("search-index-str")
				el.innerHTML = `${window.search_vars.index + 1} / ${window.search_vars.results.length} (${window.search_vars.timeSearch}s)`
			}
			window.search_prev = () => { window.search_goto(-1) }
			window.search_next = () => { window.search_goto(1) }




				


			//
			// CUSTOM BAR
			//
			let barEl = window.document.getElementById("tiro-bar-wrapper")
			barEl.innerHTML = `
			${styleBar}
			${generateHelpButton(helpText, "Exec ctag help")}
			${buttonTTs} | 
			${buttonToggleOrderHtml} | 
			${fullscreenBtn} |
			${openFormBtn} |
			${positionUI}
			${searchUI}
			`
			//
			// SHow hide bar
			//
			// const toggleCustomBar = (state) => {
			// 	let el = window.document.getElementById("tiro-bar-wrapper")
			// 	if (!state) state = el.style.display === "none" ? "show" : "hide"
			// 	el.style.display = state === "show" ? "block" : "none"
				
			// }
			// toggleCustomBar("hide")

			let toggleOpacityEls = (state) => {
				// let els = window.document.querySelectorAll(".config-wrapper")
				let el = window.document.getElementById("header-bar")
				let navEl = window.document.getElementById("nav-bar")
				let invisibleEls = window.document.querySelectorAll(".invisible-bar")
				let invisibleBlockEl = window.document.getElementById("tiro-invisible-square-back")
				let actionBarEl = window.document.getElementById("tiro-bar-wrapper")
				// #menu-button ul.menu
				let menuFoliate = window.document.querySelector("#menu-button ul.menu")
				let valHidden = 0.1
				let valShow = 1
				if (!state) state =  el.style.opacity == valHidden ? valShow : valHidden
				let nameState = state == valHidden ? "hide" : "show"
				let headerBar1 = window.document.getElementById("tiro-invisible-header-bar1")
				let headerBar2 = window.document.getElementById("tiro-invisible-header-bar2")
				el.style.opacity = state
				if (nameState === "hide") {
					headerBar1.style.opacity = 0.001
					headerBar2.style.opacity = 0.001
					invisibleBlockEl.style.display = "none"
					navEl.style.display = "none"
					actionBarEl.style.display = "none"
					// visibility show/hidden
					menuFoliate.style.visibility = "hidden"
				}
				if (nameState === "show") {
					headerBar1.style.opacity = 1
					headerBar2.style.opacity = 1
					invisibleBlockEl.style.display = "block"
					navEl.style.display = "flex"
					actionBarEl.style.display = "block"
					menuFoliate.style.visibility = "visible"
				}
				
				invisibleEls.forEach((el) => {
					if (state == 0.1) el.style.opacity = 0.001
					else el.style.opacity = 1
				})
			}
			// toggleOpacityEls(0.1)
			let cogEl = window.document.getElementById("menu-button")
			let headerBar1 = window.document.getElementById("tiro-invisible-header-bar1")
			let headerBar2 = window.document.getElementById("tiro-invisible-header-bar2")
			headerBar1.addEventListener("click", () => {  toggleOpacityEls() })
			headerBar2.addEventListener("click", () => {  toggleOpacityEls() })
			let squareEl = window.document.getElementById("tiro-invisible-square-back")
			squareEl.addEventListener("click", () => {
				// toggleCustomBar()
				toggleOpacityEls()
			})
			// on <foliate-view click, toggle opacity




			//
			// UPDATING/PERSITING POSITION
			//
			 
			const tiroReaderApi={}
			
			tiroReaderApi._storage = {
				currentPage: null
			}

			tiroReaderApi.getCurrentPageText = () => {
				// console.log(h, "getCurrentPageText", tiroReaderApi._storage.currentPage)
				// console.log(2222, readerApi.view.renderer)
				// console.log(2222, readerApi.view.renderer.toString())
				// console.log(2222, readerApi.view)
				// console.log(2222, ))
				// console.log(2222, readerApi.view.renderer.getContents())
				return readerApi.view.lastLocation.range.toString()
				// return tiroReaderApi._storage.currentPage.range.toString()
				// return tiroReaderApi._storage.currentPage?.range?.endContainer?.data
			}

			let cacheIdPos = `ctag-ebookv2-position-${epubName}`
			tiroReaderApi.restorePosition = (epubName) => {
				getCache(cacheIdPos, (bookPosition) => {
					tiroReaderApi.goTo(bookPosition.chapter, bookPosition.fractionChapter, true)
				}, err =>{
					console.log(h, "no cache found for ", cacheIdPos, err)
				})
			}

			tiroReaderApi.getAllText = (cb, cache=true) => {
				let getAllTextRaw = (cb1) => {
					window.totText = ``
					let chaptersNb = readerApi.view.getSectionFractions().length -1
					let el = window.document.getElementById("tiro-indexing-overlay")
					el.style.display = "block"
					for (let i = 0; i <= chaptersNb; i++) {
						setTimeout(() => {
							readerApi.view.renderer.goTo({ index: i }).then(res => {
									console.log(i, chaptersNb, "load")
									// notifLog(`indexing text... ${i}/${chaptersNb}`, "text-index", 10)
									el.innerHTML = `initial book indexing, please wait... ${i}/${chaptersNb}`
									let raw = readerApi.view.renderer.getContents()[0].doc.documentElement.textContent
									let arrRes = raw.split("}")
									let cleanText = arrRes[arrRes.length-1].trim()
									window.totText += cleanText
									console.log(i, chaptersNb, "getText", cleanText.length)
									if(i === chaptersNb) {
										cb1(window.totText)
										notifLog("All text indexed", "text-index", 10)
										el.style.display = "none"
										// jump back to first page
										tiroReaderApi.goTo(0, 0, true)
									}
								})
						}, 300 * i);
					}
				}

				let cyrb532 = (str, seed = 0) => {
					let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
					for(let i = 0, ch; i < str.length; i++) {
						ch = str.charCodeAt(i);
						h1 = Math.imul(h1 ^ ch, 2654435761);
						h2 = Math.imul(h2 ^ ch, 1597334677);
					}
					h1  = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
					h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
					h2  = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
					h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
				
					return 4294967296 * (2097151 & h2) + (h1 >>> 0);
				};

				let cacheIdPos = `ctag-ebookv2-alltext-${epubName}`
				let loadWithoutCache = (cb2) => {
					console.log("load without cache")
					getAllTextRaw(text => {
						let resTextHash = cyrb532(text, 1)
						// console.log("getAllText",{resTextHash, text})
						setCache(cacheIdPos, text, () => {
							console.log("cache saved!")
							cb2(text)
						})
					})
				}

				if (!cache) {
					console.log("getAllText: no cache wanted")
					loadWithoutCache(cb)
					return
				}
				getCache(cacheIdPos, text => {
					console.log("getAllText: cache found")
					cb(text)
				}, err => {
					loadWithoutCache(cb)
				})
			}
			
			// setTimeout(() => {
			// 	tiroReaderApi.getAllText(text => { console.log(h, "getAllText", text) })
			// }, 2000)



			let searchCacheId = `ctag-ebookv2-search-cache-${epubName}`
			// let searchCache = {}
			let searchCache = getLs(searchCacheId, {})
			tiroReaderApi.search = async (txt, cb, opts) => {
				let arrRes = []
				if (!searchCache[txt]) {
					console.log(`EPUB SEARCH for word ${txt} NOT CACHED, seaching...` )
					for await (const res of readerApi.view.search({query:txt})) {
						if (res.label) {
							arrRes = [...arrRes, ...res.subitems]
						} 
						if (res === "done") {
							searchCache[txt] = arrRes
							setLs(searchCacheId, searchCache)
						}
						if (opts?.firstOnly === true && arrRes.length > 0) {
							searchCache[txt] = arrRes
							console.log("firstOnly is true, breaking search")
							break
						}
					}
				} 
				arrRes = searchCache[txt]

				// for each result create .extract
				for (let i = 0; i < arrRes.length; i++) {
					let res = arrRes[i]
					// page is 12 in epubcfi(/6/12!
					let page = res.cfi.split("/")[2]
					page = "[pos "+page.split("!")[0] + "] "|| ""
					
					if (res.excerpt) { arrRes[i].extract = page + res.excerpt.pre + "<b>" + res.excerpt.match +"</b>"+ res.excerpt.post }
				}
				console.log(`EPUB SEARCH for word ${txt} CACHED, returning results`, arrRes)
				cb(arrRes)
			}


			tiroReaderApi.goToCFI = (cfi, shouldSavePosition=false) => {
				let jumpObj = readerApi.view.resolveCFI(cfi)
				console.log("jumping to ", {cfi, jumpObj})
				window.shouldSavePosition = shouldSavePosition
				readerApi.view.renderer.goTo(jumpObj) 
			}
			window.shouldSavePosition = true
			tiroReaderApi.goTo = (chapter, fraction, shouldSavePosition=false) => {
				let res = readerApi.view.renderer.goTo({index:chapter, anchor:fraction }) 
				res.then(() => {
					console.log(h, "GO TO ", chapter, fraction, res)
					window.shouldSavePosition = shouldSavePosition
					// should add one page
					// tiroReaderApi.next()
				})
			}
			tiroReaderApi.next = () => {
				readerApi.view.renderer.next()
			}
			tiroReaderApi.prev = () => {
				readerApi.view.renderer.prev()
			}

			setTimeout(() => {
				tiroReaderApi.restorePosition(epubName)
			}, 1000)



			readerApi.view.renderer.addEventListener('relocate', e => {
				let chapter = e.detail.index
				let fractionChapter = e.detail.fraction
				if (chapter === 0) return
				if (fractionChapter === 0) return
				let bookPosition = {chapter, fractionChapter }
				if (window.shouldSavePosition) {
					console.log(h, " > saving position :", chapter, fractionChapter)
					// loop all pos, does not add it if already exists
					let shouldAddIt = true
					for (let i = 0; i < window.tiro_position.allPositions.length; i++) {
						let pos = window.tiro_position.allPositions[i]
						if (pos.chapter === chapter && pos.fractionChapter === fractionChapter) {  shouldAddIt = false} 
					}
					if(shouldAddIt) window.tiro_position.allPositions.push(bookPosition) 
					setCache(cacheIdPos, bookPosition)
				}
				// tiroReaderApi._storage.currentPage = {...e.detail}
				// console.log(1111, tiroReaderApi.getCurrentPageText())
			})
			

		
			// OK SEARCH > simplement UI a faire
			// OK epub > tts > si on load depuis un certaine page > envoie la page a chercher
			// tts > epub > quand status update, faire un search regulier sur epub setInterval et search la phrase

			// setTimeout(() => {
			// 	// let sentence = `ça donnait légèrement envie de se tirer une balle, mais c’était beau. Et la Saab 900 tirait là-dedans des courbes harmonieuses`
			// 	let sentence = `interroge`
			// 	tiroReaderApi.search(sentence, cfis => { tiroReaderApi.goToCFI(cfis[0].cfi) })
			// }, 5000)



		}

			// setTimeout(() => {
			// 	tiroReaderApi.search("staline", cfis => { tiroReaderApi.goToCFI(cfis[0].cfi) })
			// 	setTimeout(() => {
			// 		tiroReaderApi.search("staline", cfis => { tiroReaderApi.goToCFI(cfis[1].cfi) })
			// 	}, 5000)
			// }, 5000)












		
		////////////////////////////////////
		//
		// FULL LOADING SEQUENCE
		//
		//

		
		const {div, updateContent} = api.utils.createDiv()
		const infos = api.utils.getInfos();
		let epubUrl = innerTagStr.trim()
		let epubName = epubUrl.split("/").slice(-1)[0].split("?")[0]
		const isAbs = epubUrl.startsWith("http")
		if (isAbs === false) {
				epubUrl = infos.backendUrl + "/static/" + infos.file.folder + "/" + epubUrl + `?token=${infos.loginToken}`
		}
		window.bookUrlToLoad = epubUrl
		window.document.body.innerHTML = `<div id="external-ressources-wrapper"></div><div id="content-wrapper"></div>${style}` 
		updateContent(injectHtmlBeforeJs())
		api.utils.loadRessources([
			`${opts.plugins_root_url}/_common/common.lib.js`,
			`https://raw.githubusercontent.com/dotgreg/foliate-js-monorepo/refs/heads/master/dist/reader.2496a5b2.js`
		], () => {
			// wait for window.reader to be availabe
			api.utils.resizeIframe("100%");
			let interval = setInterval(() => {
				if (window.reader && window.reader.view && window.reader.view.renderer) {
					console.log(h, "epub api detected, starting scripts")
					clearInterval(interval)
					onEpubLibLoaded(window.reader)
				}
			}, 200)
		})
		return div
}

window.initCustomTag = epubV2App
