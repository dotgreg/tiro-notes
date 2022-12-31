
const epubApp = (innerTagStr, opts) => {
		if (!opts) opts = {}
		if (!opts.open) opts.open = false

		const ressPath = opts.base_url + "/ressources"

		//
		// INITIALIZATION
		//
		//@ts-ignore
		const api = window.api;
		const { div, updateContent } = api.utils.createDiv();
		const infos = api.utils.getInfos();
		let epubUrl = innerTagStr.trim()
		let epubName = epubUrl.split("/").slice(-1)[0]
		const isAbs = epubUrl.startsWith("http")
		if (isAbs === false) {
				epubUrl = infos.backendUrl + "/static/" + infos.file.folder + "/" + epubUrl + `?token=${infos.loginToken}`
		}

		const h = `[CTAG EPUB VIEWER v1]`

		//
		// CACHE FUNCTIONS
		//
		const cacheId = `ctag-epub-${epubName}`
		const getCache = (id, onSuccess, onFailure) => {
				api.call("cache.get", [cacheId + id], content => {
						if (content !== undefined) onSuccess(content)
						else onFailure()
				})
		}
		const setCache = (id, content) => {
				// console.log("CACHE set", id, content);
				api.call("cache.set", [cacheId + id, content, 10000000000000])
		}

		let ctagHeight = 400

		//
		// STARTING EPUB LOGIC
		//
		window.startEpubLogic = () => {
				setTimeout(() => {
						api.utils.loadRessources(
								[
										`https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.min.js`,
										`https://cdn.jsdelivr.net/npm/epubjs@0.3.77/dist/epub.min.js`,
								],
								() => {
										api.utils.resizeIframe(ctagHeight + "px");
										// api.utils.resizeIframe(800);
										initEpubReader()
								}
						);
				}, 100)
				updateContent(htmlEpub())
		}



		//
		// MAIN LOGIC EXECUTION
		//

		const wh = ctagHeight - 50
		const p = {
				w: "100%",
				h: wh - 50,
				url: epubUrl
		}

		const initEpubReader = () => {
				var params = URLSearchParams && new URLSearchParams(document.location.search.substring(1));
				var url = params && params.get("url") && decodeURIComponent(params.get("url"));
				// var currentSectionIndex = (params && params.get("loc")) ? params.get("loc") : undefined;
				var currentSectionIndex = 2

				// Load the opf
				var book = ePub(p.url);
				var rendition = book.renderTo("viewer", {
						width: p.w,
						height: p.h,
						spread: "always"
				});

				
				//
				// adapt interface if mobile/not
				//
				const isMobile = function() {
						let check = false;
						(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
						return check;
				};
				let fontSize = isMobile() ? 2 : 12
				rendition.themes.default({ "p": { "font-size": `${fontSize}px !important`}})


				// EXT API
				//
				const jumpToPage = (pageNb) => {
						if (pageNb < 0) pageNb = 0
						let cfi = book.locations.cfiFromLocation(pageNb)
						console.log(h, "JUMPING PAGE", pageNb, cfi);
						rendition.display(cfi);
				}
				const getPage = () => {
						return rendition.currentLocation()?.start?.location || 0
				}
				const updateUI = (pageNb, p) => {
						const main = () => {
								// console.log("UPDATE UI", { pageNb, p });
								if (!p) p = {}
								if (p.pager !== false) p.pager = true
								if (p.cachePage !== false) p.cachePage = true

								window.updateTot()
								if (p.pager) window.updatePager(pageNb)
								if (p.cachePage) setCache("page", getPage())
						}

						if (!pageNb) {
								setTimeout(() => {
										pageNb = getPage()
										main()
								}, 100)

						} else {
								main()
						}
				}
				const getBookInfos = () => {
						let tot = book.locations.length()
						return { tot }
				}
				const scanBook = (onDone) => {
						window.updateStatus("scanning book...")
						const cacheLocation = "locations"
						getCache(cacheLocation, locations => {
								// console.log(1, "LOCATIONS FOUND!", locations);
								book.locations.load(locations)
								window.updateStatus("")
								onDone()
						}, () => {
								book.locations.generate(600).then(() => {
										let nLocs = book.locations._locations
										// console.log(2, nLocs);
										setCache(cacheLocation, nLocs)
										window.updateStatus("")
										onDone()
								});
						})
				}


				const goFullscreen = () => {
						const element = document.body
						// Supports most browsers and their versions.
						var requestMethod = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullScreen;

						if (requestMethod) { // Native full screen.
								requestMethod.call(element);
						} else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
								var wscript = new ActiveXObject("WScript.Shell");
								if (wscript !== null) {
										wscript.SendKeys("{F11}");
								}
						}
				}
				document.addEventListener('fullscreenchange', (event) => {
						setTimeout(() => {
								let nHeight = document.body.clientHeight - 50
								console.log(nHeight);
								rendition.resize("100%", nHeight)
						}, 1000)
				});


				const getFullBookContent = (cb) => {
						let fulltxt = ``
						book.loaded.spine.then((spine) => {
								spine.each((item, i) => {
										item.load(book.load.bind(book)).then((contents) => {
												// console.log(2222, i, spine.length, contents);
												fulltxt = fulltxt + contents.innerText
												if (i === spine.length - 1) {
														// console.log(123123, fulltxt);
														cb(fulltxt)
												}
										});
								});
						});
				}


				window.epubApi = {
						jumpToPage,
						getPage,
						updateUI,
						getBookInfos,
						scanBook,
						getFullBookContent,

						goFullscreen,
				}

				// window.jumpTo = jumpToPage


				//
				// WHEN READY
				//

				book.ready.then(() => {

						
						let eapi = window.epubApi
						// eapi.getFullBookContent(txt => {
						// 		console.log(123, txt);
						// })

						//
						// INITAL page jump
						//
						eapi.scanBook(() => {
								getCache("page", page => {
										// console.log(h, "getting page", page);
										eapi.jumpToPage(page)
										eapi.updateUI(page, { cachePage: false })
								}, () => { })
						})

						// eapi.jumpToPage(10)
						// eapi.updateUI(10)
						const onClick = (elIds, action) => {
								for (var i = 0; i < elIds.length; ++i) {
										let el = document.getElementById(elIds[i]);
										el.addEventListener("click",  e => {action(e)}, false);
								}
						}
						onClick(["full"], e => {
								eapi.goFullscreen();
								eapi.updateUI();
								e.preventDefault();
						})
						onClick(["next", "overlay-next"], e => {
								book.package.metadata.direction === "rtl" ? rendition.prev() : rendition.next();
								eapi.updateUI()
								e.preventDefault();
						})
						onClick(["prev", "overlay-prev"], e => {
								book.package.metadata.direction === "rtl" ? rendition.next() : rendition.prev();
								eapi.updateUI()
								e.preventDefault();
						})
						





						var keyListener = function (e) {

								// Left Key
								if ((e.keyCode || e.which) == 37) {
										book.package.metadata.direction === "rtl" ? rendition.next() : rendition.prev();
								}

								// Right Key
								if ((e.keyCode || e.which) == 39) {
										book.package.metadata.direction === "rtl" ? rendition.prev() : rendition.next();
								}

						};

						rendition.on("keyup", keyListener);
						document.addEventListener("keyup", keyListener, false);

						var title = document.getElementById("title");

						rendition.on("rendered", function (section) {
								var current = book.navigation && book.navigation.get(section.href);

								if (current) {
										// var $page = document.getElementById("page");


										var $select = document.getElementById("toc");
										var $selected = $select.querySelector("option[selected]");
										if ($selected) {
												$selected.removeAttribute("selected");
										}

										var $options = $select.querySelectorAll("option");
										for (var i = 0; i < $options.length; ++i) {
												let selected = $options[i].getAttribute("ref") === current.href;
												if (selected) {
														$options[i].setAttribute("selected", "");
												}
										}
								}

						});

						rendition.on("relocated", function (location) {
								eapi.updateUI()



								var next = book.package.metadata.direction === "rtl" ? document.getElementById("prev") : document.getElementById("next");
								var prev = book.package.metadata.direction === "rtl" ? document.getElementById("next") : document.getElementById("prev");

								if (location.atEnd) {
										next.style.visibility = "hidden";
								} else {
										next.style.visibility = "visible";
								}

								if (location.atStart) {
										prev.style.visibility = "hidden";
								} else {
										prev.style.visibility = "visible";
								}

						});

						rendition.on("layout", function (layout) {
								let viewer = document.getElementById("viewer");

								if (layout.spread) {
										viewer.classList.remove('single');
								} else {
										viewer.classList.add('single');
								}
						});

						window.addEventListener("unload", function () {
								// console.log(h, "unloading");
								this.book.destroy();
						});

						book.loaded.navigation.then(function (toc) {
								var $select = document.getElementById("toc"),
										docfrag = document.createDocumentFragment();

								toc.forEach(function (chapter) {
										var option = document.createElement("option");
										option.textContent = chapter.label;
										option.setAttribute("ref", chapter.href);

										docfrag.appendChild(option);
								});

								$select.appendChild(docfrag);

								$select.onchange = function () {
										var index = $select.selectedIndex,
												url = $select.options[index].getAttribute("ref");
										rendition.display(url);
										eapi.updateUI()

										return false;
								};

						});


				})



				const status = document.getElementById("status")
				const pager = document.getElementById("page")
				const tot = document.getElementById("tot")
				const onPagerChange = (e) => {
						const nPage = e.target.value
						window.epubApi.jumpToPage(nPage)
						window.epubApi.updateUI(nPage, { pager: false })
				}

				pager.onchange = onPagerChange
				pager.onkeyup = onPagerChange

				window.updatePager = (nPage) => {
						pager.value = nPage
				}
				window.updateTot = () => {
						tot.innerHTML = window.epubApi.getBookInfos().tot
				}
				window.updateStatus = (text) => {
						status.innerHTML = text
				}

		}


















		//
		// BUTTON OR DIRECT DISPLAY READER
		//
		if (opts.open) {

				window.startEpubLogic()

		} else {
				const html_button = `
				<div class="button-open-epub">
				<div class="resource-link-wrapper">
				<div class="resource-link-icon epub"></div>
				<a class="resource-link preview-link" >
				${epubName}
				</a>
				</div>
				<button onclick="window.startEpubLogic()">Open</button>
				</div>
				<style>
				.button-open-epub button {
						position: absolute;
						top: 26px;
						right: 20px;
				}
				.button-open-epub .resource-link-wrapper {
						padding-right: 61px;
				}
				</style>
				`
				updateContent(html_button)
		}

		return div
}

window.initCustomTag = epubApp


const htmlEpub = () => `
<div id="status">loading...</div>
<div id="viewer" class="spreads"></div>

<div class="controls-wrapper">
		<select id="toc"></select>
		<input type="number" id="page" min="0" /> / <div id="tot">0</div>
		<input type="button" id="prev" value="<" />
		<input type="button" id="next" value=">" />
		<input type="button" id="full" value="↔" />
</div>

<div class="overlay-controls">
		<div  id="overlay-next"></div>
		<div id="overlay-prev"></div>
</div>

<style>${cssEpub()}</style>
`

const cssEpub = () => `
html {
		background: rgb(247, 246, 246);
}
body {
		margin: 0;
		margin-left: 7px!important;
		background: rgb(247, 246, 246);
		font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
		color: #333;

		position: absolute;
		height: 100%;
		width: calc(100% - 4px);
		/* padding: 2px; */
		/* display:none; */

}
.overlay-controls {
position: fixed;
top: 0px;
left: 0px;
width: 100vw;
}
.overlay-controls div {
cursor: pointer;
position: absolute;
top: 0px;
left: 0px;
width: 40vw;
height: 100vh;
}
.overlay-controls #overlay-next {
right: 0px;
left: auto;
}

#title {
		width: 900px;
		min-height: 18px;
		margin: 10px auto;
		text-align: center;
		font-size: 16px;
		color: #E2E2E2;
		font-weight: 400;
}

#title:hover {
		color: #777;
}

#viewer.spreads {
		box-shadow: 0 0 4px #ccc;
		border-radius: 5px;
		padding: 0;
		position: relative;
		margin: 10px auto;
		background: white url('ajax-loader.gif') center center no-repeat;
}

#viewer.spreads .epub-view > iframe {
    background: white;
}

#viewer.scrolled {
		overflow: hidden;
		width: 800px;
		margin: 0 auto;
		position: relative;
		background: url('ajax-loader.gif') center center no-repeat;

}

#viewer.scrolled .epub-container {
		background: white;
		box-shadow: 0 0 4px #ccc;
		margin: 10px;
		padding: 20px;
}

#viewer.scrolled .epub-view > iframe {
    background: white;
}

#prev {
		left: 0;
}

#next {
		right: 0;
}

.controls-wrapper {
		position: relative;
		z-index: 1;
		display: flex;
		margin: 10px auto;
}
#toc {
		width: 80%;
		display: block;
}
#toc,
#next,
#page  {
		margin-left: 5px;
}

#page {
		width: 50px;
		height: 18px;
}

@media (min-width: 1000px) {
		#viewer.spreads:after {
				position: absolute;
				width: 1px;
				border-right: 1px #000 solid;
				height: 90%;
				z-index: 1;
				left: 50%;
				margin-left: -1px;
				top: 5%;
				opacity: .15;
				box-shadow: -2px 0 15px rgba(0, 0, 0, 1);
				content:  "";
		}

		#viewer.spreads.single:after {
				display: none;
		}

		#prev {
				left: 40px;
		}

		#next {
				right: 40px;
		}
}

.arrow {
		position: fixed;
		top: 50%;
		margin-top: -32px;
		font-size: 64px;
		color: #E2E2E2;
		font-family: arial, sans-serif;
		font-weight: bold;
		cursor: pointer;
		-webkit-user-select: none;
		-moz-user-select: none;
		user-select: none;
		text-decoration: none;
}

.navlink {
		margin: 14px;
		display: block;
		text-align: center;
		text-decoration: none;
		color: #ccc;
}

.arrow:hover, .navlink:hover {
		color: #777;
}

.arrow:active, .navlink:hover {
		color: #000;
}

#book-wrapper {
		width: 480px;
		height: 640px;
		overflow: hidden;
		border: 1px solid #ccc;
		margin: 28px auto;
		background: #fff;
		border-radius: 0 5px 5px 0;
		position: absolute;
}

#book-viewer {
		width: 480px;
		height: 660px;
		margin: -30px auto;
		-moz-box-shadow:      inset 10px 0 20px rgba(0,0,0,.1);
		-webkit-box-shadow:   inset 10px 0 20px rgba(0,0,0,.1);
		box-shadow:           inset 10px 0 20px rgba(0,0,0,.1);
}

#book-viewer iframe {
		padding: 40px 40px;
}

#controls {
		position: absolute;
		bottom: 16px;
		left: 50%;
		width: 400px;
		margin-left: -200px;
		text-align: center;
		display: none;
}

#controls > input[type=range] {
    width: 400px;
}

#navigation {
		width: 400px;
		height: 100vh;
		position: absolute;
		overflow: auto;
		top: 0;
		left: 0;
		background: #777;
		-webkit-transition: -webkit-transform .25s ease-out;
		-moz-transition: -moz-transform .25s ease-out;
		-ms-transition: -moz-transform .25s ease-out;
		transition: transform .25s ease-out;

}

#navigation.fixed {
		position: fixed;
}

#navigation h1 {
		width: 200px;
		font-size: 16px;
		font-weight: normal;
		color: #fff;
		margin-bottom: 10px;
}

#navigation h2 {
		font-size: 14px;
		font-weight: normal;
		color: #B0B0B0;
		margin-bottom: 20px;
}

#navigation ul {
		padding-left: 36px;
		margin-left: 0;
		margin-top: 12px;
		margin-bottom: 12px;
		width: 340px;
}

#navigation ul li {
		list-style: decimal;
		margin-bottom: 10px;
		color: #cccddd;
		font-size: 12px;
		padding-left: 0;
		margin-left: 0;
}

#navigation ul li a {
		color: #ccc;
		text-decoration: none;
}

#navigation ul li a:hover {
		color: #fff;
		text-decoration: underline;
}

#navigation ul li a.active {
		color: #fff;
}

#navigation #cover {
		display: block;
		margin: 24px auto;
}

#navigation #closer {
		position: absolute;
		top: 0;
		right: 0;
		padding: 12px;
		color: #cccddd;
		width: 24px;
}

#navigation.closed {
		-webkit-transform: translate(-400px, 0);
		-moz-transform: translate(-400px, 0);
		-ms-transform: translate(-400px, 0);
}

svg {
		display: block;
}

.close-x {
		stroke: #cccddd;
		fill: transparent;
		stroke-linecap: round;
		stroke-width: 5;
}

.close-x:hover {
		stroke: #fff;
}

#opener {
		position: absolute;
		top: 0;
		left: 0;
		padding: 10px;
		stroke: #E2E2E2;
		fill: #E2E2E2;

}

#opener:hover {
		stroke: #777;
		fill: #777;
}
`
