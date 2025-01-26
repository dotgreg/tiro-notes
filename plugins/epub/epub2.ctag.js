
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
			
			.toolbar{

			}
			#content-wrapper {
			}
			// body, html, .simple-css-wrapper, #content-wrapper {
			// 	 height: 400px!important;
			// 	// height: 100%;
			// }
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
				width: calc(100% - 48px);
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
				bottom: 0;
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
				<div id="header-bar" class="toolbar">
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
		<h3>Exec Ctag Help</h3>
		<p>Execute calculations in javascript and get the output in a table</p>
		<p>If some lines starts like r.aCalculation = <...>, it will appear on the result </p>
		
		`

		const onEpubLibLoaded = (reader) => {
			console.log("EPUB LIB LOADED success", reader)
			reader.view.renderer.addEventListener('relocate', e => {
				// console.log('2relocate!!!!!!!', e.detail)
			})
		}
		














		
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

		const resizeFn = () =>{
			console.log("resizeFn")
			// api.utils.resizeIframe("100%");
		}

		api.utils.loadRessources([
				// `https://raw.githubusercontent.com/dotgreg/foliate-js-monorepo/f4d4e0372c9e04c0431646807499f10b555c6684/dist/reader.2496a5b2.js`
				`https://raw.githubusercontent.com/dotgreg/foliate-js-monorepo/refs/heads/master/dist/reader.2496a5b2.js`
		], () => {
				
				

			api.utils.resizeIframe("200px");
			// resizeFn()

				// wait for window.reader to be availabe
				let interval = setInterval(() => {
					if (window.reader) {
						clearInterval(interval)
						onEpubLibLoaded(window.reader)
						// window.addEventListener("resize", () =>{
						// 	console.log("resize", window.innerHeight, window.innerWidth)
						// })
					}
				}, 200)

				
				// setTimeout(() => {
				// 		// RESIZING
				// 		let resDiv = document.body 
				// 		console.log("resDiv", resDiv, document.body.clientHeight)
				// 		api.utils.resizeIframe(`${resDiv.clientHeight - 220}px`);
				// 		// delete content-wrapper
				// 		// document.getElementById("content-wrapper").remove()
				// }, 1000)
				
		})
		setTimeout(() => {
				updateContent("epub v2 loading...")
		})
		return div
}

window.initCustomTag = epubV2App
