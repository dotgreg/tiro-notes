const graphApp = (innerTagStr, opts) => {
		const folderPath = innerTagStr.trim()
		const infos = api.utils.getInfos()
		if (!opts) opts = {}
		if (!opts.size) opts.size = "100%"
		const h = `[GRAPH CTAG] 1.0.3 27/10/22 =>`

		if (!folderPath.startsWith("/")) return console.error(h, "folderpath should start by a '/'")
		console.log(h, "init CTAG with folder:", folderPath);
		// const folder = "/test_obsi"






		// TODO : to get only clicked connections highlighted https://codepen.io/pen?editors=1010
		///////////////////////////////////////////////////
		// 0. COLOR
		//

		let mainColor = "";
		const initFetchUserColor = (cb) => {
				api.call("userSettings.get", ['ui_layout_colors_main'], color => {
						mainColor = new Color(color);
						cb()
				});
		}

		const getMainColor = (opacity, variation) => {
				// console.log(mainColor);
				let rgb = [mainColor.srgb.r * 100, mainColor.srgb.g * 100, mainColor.srgb.b * 100]
				if (!variation) variation = [0, 0, 0]
				let v = variation
				let str = `rgba(${rgb[0] + v[0]}%,${rgb[1] + v[1]}%,${rgb[2] + v[2]}%,${opacity})`
				return str
		}









		///////////////////////////////////////////////////
		// 1. DATA LOADING
		//
		const clamp = (val, min, max) => Math.min(Math.max(val, min), max)
		const loadDatas = (cb) => {
				const hasUserReloaded = api.utils.getInfos().reloadCounter !== 0
				if (hasUserReloaded) {
						// no cache
						fetchAndProcessData(cb)
				} else {
						// try cache, el
						getCache(
								res => { cb(res) },
								() => { fetchAndProcessData(cb) }
						)
				}
		}

		// CACHING MECHANISM
		const cacheId = `ctag-graph-${folderPath}`
		const getCache = (onSuccess, onFailure, customCacheId) => {
				let cId = customCacheId ? cacheId + customCacheId : cacheId

				api.call("cache.get", [cId], content => {
						if (content !== undefined) {
								onSuccess(content)
						}
						else {
								onFailure()
						}
				})
		}
		const setCache = (content, customCacheId) => {
				let cId = customCacheId ? cacheId + customCacheId : cacheId
				api.call("cache.set", [cId, content, 10000000])
		}


		// DATA FETCHING
		const fetchAndProcessData = (cb) => {
				api.call("search.hashtags", [folderPath], hashtags => {
						const res = {}

						// preparing nodes
						res.nodes = hashtags.nodesArr
						for (let i = 0; i < res.nodes.length; i++) {
								res.nodes[i].label = res.nodes[i].name
								const nbParts = res.nodes[i].noteParts.length
								// increase group repulsion to other non connected groups
								const mass = 3
								res.nodes[i].mass = mass
								// size node according to nb of apparition
								let size = 5 + (nbParts * 5)
								size = clamp(size, 5, 30)
								res.nodes[i].size = size
						}

						// preparing edges
						res.edges = []
						const edges = hashtags.edges
						for (let y = 0; y < edges.length; y++) {
								const edge = edges[y].split("-")
								res.edges.push({ from: edge[0], to: edge[1] })
						}
						// we set cache later, when we get positions
						// setCache(res)
						cb(res)
				});

		}









		///////////////////////////////////////////////////
		// 2. GRAPH 
		//
		const initGraph = (data, cb) => {
				var container = document.getElementById("mynetwork");
				var options = {
						// physics: {
						// barnesHut: { gravitationalConstant: -30000 },
						// stabilization: { iterations: 2500 },
						// },
						// clickToUse: true,
						layout: {
								randomSeed: "dfsapoin2",
								improvedLayout: false,
								hierarchical: {
										enabled: false,
								}
						},

						autoResize: true,
						height: '100%',
						width: '100%',
						physics: {
								enabled: true,
								stabilization: true

						},
						edges: {
								smooth: false,
								color: { inherit: "from" },
						},
						nodes: {
								shape: "dot",
								size: 16,
								color: {
										border: getMainColor(1),
										background: getMainColor(1, [0, 0, 10]),
										// highlight: {
										// 	border: "#ff0000",
										// 	background: "#ff0000",
										// }
								}
						},

				};


				//
				// DATA MANAGEMENT
				//
				let d2 = {
						nodes: new vis.DataSet(data.nodes),
						edges: new vis.DataSet(data.edges)
				}
				var network = new vis.Network(container, d2, options);
				// GET POSITION AFTER FIRST STABIL, then set it to cache
				network.on('stabilized', () => {
						console.log(h, "STABILIZED! caching data + positions for faster usage");
						network.storePositions()
						let dataCache = { nodes: d2.nodes.get(), edges: d2.edges.get() }
						setCache(dataCache)
				})
				network.on('stabilizationProgress', (e) => {
						let percent = Math.round((e.iterations / e.total) * 100)
						updateLoadingPopup(percent);
				})

				// INIT POPUP
				const createPopupWithData = createPopup(data);
				network.on("click", createPopupWithData);

				// trigger on first redraw
				let hasStarted = false
				network.on("afterDrawing", () => {
						if (!hasStarted) {
								hasStarted = true;
								cb(network);
						}
				});
				// cb(network);
		}


		//
		// LOADING INITIAL POPUP MANAGEMENT
		//
		function debounce(func, timeout = 300) {
				let timer;
				return (...args) => {
						clearTimeout(timer);
						timer = setTimeout(() => { func.apply(this, args); }, timeout);
				};
		}
		const debounceHideLoadingPopup = debounce(() => {
				let wbEl = document.querySelector("#waiting-bar");
				wbEl.classList.add('hidden');
		}, 500)

		const updateLoadingPopup = (percent) => {
				let str = `Graph stabilization: ${percent}%`
				let wbEl = document.querySelector("#waiting-bar");
				// console.log(str, e);
				debounceHideLoadingPopup()
				if (percent > 95 || percent < 5) {
						debounceHideLoadingPopup()
				} else {
						wbEl.innerHTML = str
						wbEl.classList.remove('hidden');
				}
		}








		///////////////////////////////////////////////////
		// 3. CREATE POPUP
		//
		const createPopup = data => d => {
				const nodeId = d.nodes[0]
				if (!nodeId) return
				const node = data.nodes.find(x => x.id === nodeId);

				const parts = node.noteParts
				const popupTitle = `Hashtag "${node.name}" Research`
				let toShow = `
				<div id="popup-graph-wrapper">
				"${node.label}" found in : <br>
																		<br>
																		<div class="links-wrapper">
																		`
				// const file
				//
				// JS RELATED FUNCTIONS
				//
				const popupFunctionStr = (file) => `
																		window.api.file.getContent('${file.path}', ncontent => {
				ncontent2 = window.api.note.render({raw: ncontent, file: ${JSON.stringify(file).replaceAll('\"', '\'')}, windowId:''})
				ncontent2 = ncontent2.replaceAll('${node.name}', '<span class=\\'found-word\\'>${node.name}</span>')
				const previewEl = document.getElementById('popup-part-preview');
				previewEl.innerHTML = '<div class=\\'file-content render-latex\\'><h3>${file.path}</h3>' + ncontent2 +'</div>';
				setTimeout(() => {
		document.querySelector('#popup-part-preview .found-word').scrollIntoView();
}, 100)
		})
																		`
				const openInActiveWindowStr = (file) => `window.api.ui.windows.active.setContent(${JSON.stringify(file).replaceAll('\"', '\'')}); `

				const objsToDisplay = {}
				for (let i = 0; i < parts.length; i++) {
						if (!objsToDisplay[parts[i].file.name]) {
								objsToDisplay[parts[i].file.name] = {
										file: parts[i].file,
										partsName: []
								}
						}
						if (parts[i].titleName !== "") objsToDisplay[parts[i].file.name].partsName.push(parts[i].titleName)
				}


				toShow += `<ul class="notes-list">`
				for (let key in objsToDisplay) {
						const obj = objsToDisplay[key]
						toShow += `<li><a href="#/" onclick="${popupFunctionStr(obj.file)}">`
						toShow += `${obj.file.name}${obj.partsName.length === 0 ? "" : " in #"}${obj.partsName.join(" ,#")}`
						toShow += `</a> | `
						toShow += `<a href="#/" onclick="${openInActiveWindowStr(obj.file)}"> > </a></li>`
				}
				toShow += `</ul>`


				toShow += `</div>
				<div id="popup-part-preview">
				</div>
				<style>
				#popup-graph-wrapper .notes-list {
						margin: 0px;
						margin-left: 12px;
						padding: 0px;
				}
				#popup-graph-wrapper {
						text-align: left;
				}
				#popup-part-preview h3.note-title {
						margin-bottom: 10px;
						margin-top: 0px;
				}
				#popup-part-preview p {
						margin: 0px;
				}
				#popup-part-preview ul,
				#popup-part-preview li {
						margin: 0px;
				}
				#popup-part-preview .found-word {
						font-weight: bold;
						background: #fff876;
						padding: 2px;
				}
				#popup-part-preview img {
						max-width: 300px;
				}
				#popup-part-preview .file-content {
						padding: 10px 30px;
				}
				#popup-part-preview {
						max-height: 50vh;
						overflow-y: scroll;
						background: gainsboro;
						padding: 0px;
						margin-top: 20px;
				}

				</style>
				</div>
				`
				api.call("popup.show", [toShow, popupTitle])

		}










		///////////////////////////////////////////////////
		// 3.1 NETWORK INPUT FILTERING AND JUMP
		//
		const inputFilterHtml = `
		<style>

		#network-wrapper.is-mobile #filter-graph-wrapper{
				opacity: 1;
		}
		#network-wrapper:hover #filter-graph-wrapper{
				opacity: 1;
		}
		#filter-graph-wrapper {
				opacity: 0;
				transition: all 0.2s;
		}


		#filter-graph-wrapper {
				position: absolute;
				right: 10px;
				top: 10px;
				z-index: 10;
		}
		#filter-graph::placeholder {
				color:#a1a1a1;
		}
		#filter-graph {
				color:#a1a1a1;
				background: none;
				border: none;
				border-bottom: 1px solid #dddddd;
				padding-bottom: 6px;
				font-weight: 400;
				font-size: 12px;
				outline: none;
		}
		#filter-best-guess {
				font-size: 10px;
				color:#a1a1a1;
		}
		</style>
		<div id="filter-graph-wrapper">
		<input
		type="text"
		id="filter-graph"
		placeholder="Type to filter"
		/>
		<div id="filter-best-guess"></div>
		</div>
		`
		const normalizeStr = str => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
		const initFilterInput = (data, network) => {
				const filterWrapper = document.getElementById('filter-graph-wrapper');
				const filterInput = document.getElementById('filter-graph');
				const bestGuessEl = document.getElementById('filter-best-guess');



				// caching in LS filter
				const filterIdCache = "filter-cache"
				const fetchFilterValue = () => {
						console.log(h, "=> fetch filter value from backend");
						getCache(initValueFilter => {
								if (initValueFilter) {
										const filterInput = document.getElementById('filter-graph');
										filterInput.value = initValueFilter
										setTimeout(() => {
												searchForWord()
										}, 100)
								}
						}, () => {}, filterIdCache)
				}
				// try fetching several times at beginning
				setTimeout(()=>{
						fetchFilterValue()
						setTimeout(()=>{
								fetchFilterValue()
								setTimeout(()=>{
										fetchFilterValue()
								}, 1000)
						}, 1000)
				}, 100)
				


				let lastval = ''
				let lastid = 0
				const searchForWord = e => {
						const isEnter = e && e.key === "Enter"

						setTimeout(() => {
								// window.localStorage.setItem(graphFilterCacheId, filterInput.value)
								setCache(filterInput.value, filterIdCache)
								const val = normalizeStr(filterInput.value)
								// fill probable guesses
								const resArr = []
								if (val.length > 2) {
										for (let i = 0; i < data.nodes.length; i++) {
												const cnode = data.nodes[i]
												const cname = normalizeStr(cnode.name)
												if (cname.includes(val)) resArr.push(cnode)
										}
								}

								// if enter press, loop results if possible
								if (isEnter) {
										if (lastval === val) {
												if (resArr.length > lastid) lastid += 1
												else lastid = 0
										} else {
												lastid = 0
										}
								} else {
										lastid = 0
								}

								// display the guess
								const guessed = resArr[lastid]
								lastval = val
								let resGuess = '[enter] to loop'
								if (guessed) {
										if (resArr.length > 0) { resGuess = `${lastid + 1}/${resArr.length} : "${guessed.name}"` }
										// focus and select it
										const scale = network.getScale() < 0.1 ? 0.5 : network.getScale()
										network.focus(`${guessed.id}`, { scale: 0.5 })
										network.selectNodes([guessed.id])
								} else {
										// dezoom
										network.moveTo({ position: { x: 0, y: 0 }, scale: 0.1 })
								}
								bestGuessEl.innerHTML = resGuess
						}, 10)
				}
				filterInput && filterInput.addEventListener("keydown", searchForWord);
		}





		///////////////////////////////////////////////////
		// 4. LIB LOAD + CTAG BOOT
		//
		api.utils.loadRessources(
				[
						'https://colorjs.io/dist/color.global.js',
						'https://visjs.github.io/vis-network/standalone/umd/vis-network.min.js',
				], () => {
						loadDatas(data => {
								initFetchUserColor(() => {
										initGraph(data, (network) => {
												initFilterInput(data, network);
												initExperienceFromDeviceType();
										})
								})
								api.utils.resizeIframe(opts.size);
						})
				}
		)


		// mobile, input
		const initExperienceFromDeviceType = () => {
				const mobileAndTabletCheck = function () {
						let check = false;
						(function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
						return check;
				};
				const classWrapper = mobileAndTabletCheck() ? "is-mobile" : "is-desktop"
				document.getElementById('network-wrapper').classList.add(classWrapper);
		}

		const styleHtml = `<style>
		html, body, .with-padding, #mynetwork, .simple-css-wrapper, #content-wrapper, #network-wrapper, #content-wrapper > div  {
				width: 100%;
				height: ${opts.size};
		}

				#waiting-bar {
					position: absolute;
					z-index: 1000;
					top: 50%;
					left: 50%;
					transform: translate(-50%,-50%);
					background: white;
					border-radius: 3px;
					padding: 10px;
					box-shadow: 0px 0px 2px rgb(0 0 0 / 20%);
				}
#waiting-bar.hidden {
display: none;

}

		</style>
		`
		return `
		${styleHtml}
		<div id="network-wrapper">
		<div id="popup"></div>
		${inputFilterHtml}
		<div id="mynetwork"></div>
		<div id="waiting-bar" class="hidden"></div>
		</div>
		`
}

window.initCustomTag = graphApp
