
const graphApp = (innerTagStr, opts) => {
	window.helpStrTable = `
	<h3>Graph Component</h3>
	<p> This is the graph component

	<h3> 1) Titles mode: Create a graph from your current folder files titles</h3>
	<p> You can create a graph which will use your markdown titles hierarchy to create a graph with the following code: <br></p>

	<code>
	<pre>
	[[graph]]
	/path/to/folder | titles
	[[graph]]
	</pre>
	</code>

	<h4> Remove some titles by making them starting with _</h4>
	<p> If you want to remove some titles from the graph, you can make them start with a _ in the title. <br></p>

	<h3> 2) Filtered Title mode: Only select some titles</h3>
	<p> You can choose to only display some titles by adding a third parameter in the graph code. The example below will only show titles starting by "." <br></p>

	<code>
	<pre>
	[[graph]]
	/path/to/folder | titles | # \\\\.
	[[graph]]
	</pre>
	</code>


	<h3> 3) Hashtag mode</h3>
	<p> You can create your own graph by only using hashtags. To create links between tags, they should be on the same line <br>

	<code>
	<pre>
	FILE1.md: <br>

	here is a #parent_notion that has several children: #child1 <br/>
	as well as #parent_notion #child2 <br/>
	as well as #parent_notion #child3 <br/>
	<br/>
	#child3 is also connected to #subchild31 <br/>
	#child3 is also connected to #subchild32 <br/>
	#child3 is also connected to #subchild33 <br/>
	</pre>
	</code>


	<code>
	<pre>
	Graph.md: <br>
	[[graph]]
	/path/to/folder | tags
	[[graph]]
	</pre>
	</code>
	`


		// format of innerTagStr => folderpath | graphType = "tags" or "titles" (opt) | innerTagOption3 (opt)
		const folderPath = innerTagStr.split("|")[0].trim() 
		const graphType = innerTagStr.split("|")[1]?.trim() || "tags"
		const innerTagOption3 = innerTagStr.split("|")[2]?.trim() 

		const infos = api.utils.getInfos()
		if (!opts) opts = {}
		if (!opts.size) opts.size = "100%"
		if (!opts.disableCache) opts.disableCache = false
		const h = `[GRAPH CTAG] =>`

		if (!folderPath.startsWith("/")) return console.error(h, "folderpath should start by a '/'")
		console.log(h, "init CTAG with params:", { folderPath, graphType, innerTagOption3, opts, innerTagStr });

	///////////////////////////////////////////////////
	// 0. COLOR
	//
	let mainColor = "";
	const initFetchUserColor = (cb) => {
		api.call("userSettings.get", ['ui_layout_colors_main'], color => {
			colorStr = color.currentValue || color.defaultValue
			mainColor = new Color(colorStr);
			cb()
		});
	}
	const getMainColor = (opacity, variation) => {
		let rgb = [mainColor.srgb.r * 100, mainColor.srgb.g * 100, mainColor.srgb.b * 100]
		if (!variation) variation = [0, 0, 0]
		let v = variation
		let str = `rgba(${rgb[0] + v[0]}%,${rgb[1] + v[1]}%,${rgb[2] + v[2]}%,${opacity})`
		return str
	}

	///////////////////////////////////////////////////
	// 1. SUPPORT
	//
	const each = (itera/*: Array<any> | { [key: string]: any } */, cb/*:Function*/) => {
		if (itera.constructor === Array) {
			for (let i = 0; i < itera.length; ++i) {
				cb(itera[i])
			}
		} else {
			for (const property in itera) {
				cb(itera[property], property)
			}
		}
	}


		///////////////////////////////////////////////////
		// 1. DATA LOADING
		//
		const clamp = (val, min, max) => Math.min(Math.max(val, min), max)
		const loadDatas = (cb, p) => {
				// const opts.disableCache = api.utils.getInfos().reloadCounter !== 0
				if (opts.disableCache || p?.disableCache) {
					console.log(h, "no cache data fetching...");
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
		const cacheId = `ctag-graph-${folderPath}-${innerTagOption3}-${graphType}`
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
			if (graphType === "tags") {
				fetchAndProcessDataHashtags(cb)
			} else if (graphType === "titles") {
				fetchAndProcessDataTitles(cb)
			}
		}

	/////////////////////////////////////////////
	//
	// TITLE METHOD
	//
	/////////////////////////////////////////////

	function createNodesAndEdgesFromFiles(filesResults, folderPath) {
		const nodes = new Set();
		const nodesPath = new Set();
		// const nodes = []
		const edges = [];
		let maxI = 0
		each(filesResults, fileResults => {
			// if folderpath is /root/base/d3, keep /root/base
			// let parentFolderPath = folderPath.split('/').slice(0, -1).join('/');
			// fileResults.file.path = fileResults.file.path.replace(parentFolderPath, '');
			const pathParts = fileResults.file.path.split('/').filter(part => part !== '');
			for (let i = 0; i < pathParts.length; i++) {
				nodes.add(pathParts[i] + "_-_-*-_-_"+ i);
				maxI = Math.max(maxI, i)
				if (i > 0) {
					edges.push({ from: pathParts[i - 1], to: pathParts[i] });
				}
			}
		});
		return {
			nodes: Array.from(nodes).map(name => {
				console.log(name, nodesPath[0])
				let i = name.split("_-_-*-_-_")[1]
				i = parseInt(i) 
				let nI = maxI - i
				name = name.split("_-_-*-_-_")[0]
				// const ncolor = [-20*nI, -20*nI,-20*nI] 
				const ncolor = [200,200,200]
				const nOpacity = 0.2*i
				let nColor = getMainColor(nOpacity, ncolor)
				let nColPar = 100 + 20*i
				nColPar = 180 - 30*i
				let nOpacityPar = 1-(0.1*nI)
				nOpacityPar = 1

				nColor = `rgba(${nColPar},${nColPar},${nColPar},${nOpacityPar})`
				return {
					name,
					nodeOrigin: "fileName",
					color: {
						border:nColor, 
						background:nColor, 
					}
				}
			}),
			edges: edges
		};
	}

	let createNodesAndEdgesFromTitlesContent = (fileResults, file) => {
		fileResults = fileResults.filter(item => item.trim().startsWith('#'));
		const nodes = fileResults.map(item => {
			let titleRaw = item
			let title = item.trim().replace(/^#+\s*/, '').trim()
			let level = item.match(/^#+/)  ? item.match(/^#+/)[0].length : -1
			return {
				name: `${title}_${file.name}`,
				label: title,
				nodeOrigin: "title",
				level,
				noteParts: [{
					file: file,
					titleName: title
				}]
			}
		});
		const edges = [];
		// for each level 1, create an edge from the filename to the level 1
		nodes.forEach(node => {
			if (node.level === 1) {
				edges.push({ from: file.name, to: node.name });
			}
		})
		for (let i = 0; i < fileResults.length; i++) {
			const currentLevel = fileResults[i].match(/^#+/) ? fileResults[i].match(/^#+/)[0].length : -1;
			for (let j = i + 1; j < fileResults.length; j++) {
				const nextLevel = fileResults[j].match(/^#+/) ? fileResults[j].match(/^#+/)[0].length : -1;
				if (nextLevel === currentLevel + 1) {
					nodes[j].name = `${nodes[i].name}__${nodes[j].label}`;	
					edges.push({ from: nodes[i].name, to: nodes[j].name });
				} else if (nextLevel <= currentLevel) {
					break;
				}
			}
		}
		console.log(h, "result from createNodesAndEdgesFromTitlesContent", file.name, { nodes, edges })
		return { nodes, edges };
	}



		const fetchAndProcessDataTitles = (cb) => {
			// if innerTagOption3 exists, do a search on it, like if "." search for "# ."
			let searchee = innerTagOption3 ? `${innerTagOption3}` : "#"
			api.call("search.word", [searchee, folderPath], filesResult => {
				// for each result
				let res = {}
				let nodes = []
				let edges = []

				nodes = createNodesAndEdgesFromFiles(filesResult, folderPath).nodes;
				edges = createNodesAndEdgesFromFiles(filesResult, folderPath).edges;

				each(filesResult, (fileResults) => {
					nodes = nodes.concat(createNodesAndEdgesFromTitlesContent(fileResults.results, fileResults.file).nodes);
					edges = edges.concat(createNodesAndEdgesFromTitlesContent(fileResults.results, fileResults.file).edges);
				})

				res.nodes = nodes
				res.edges = edges

				let cid = 0
				for (let i = 0; i < res.nodes.length; i++) {
					cid++
					// if no label it is its name
					res.nodes[i].label = res.nodes[i].label || res.nodes[i].name
					res.nodes[i].id = cid
					// according to the nb of edges to it, create the mass and size 
					for (let j = 0; j < res.edges.length; j++) {
						if (res.edges[j].from === res.nodes[i].name || res.edges[j].to === res.nodes[i].name) {
							res.nodes[i].mass = res.nodes[i].mass ? res.nodes[i].mass + 1 : 1
							res.nodes[i].size = res.nodes[i].size ? res.nodes[i].size + 3 : 10
							// max size is 100
							res.nodes[i].size = Math.min(res.nodes[i].size, 60)
						}
					}
				}

				// remove the nodes which name starts with _
				res.nodes = res.nodes.filter(x => !x.name.startsWith("_"))
				// remove the edges where either the from or the to starts with _
				res.edges = res.edges.filter(x => !x.from.startsWith("_") && !x.to.startsWith("_"))

				// replace name by id in edges
				for (let i = 0; i < res.edges.length; i++) {
					const from = res.nodes.find(x => x.name === res.edges[i].from)
					const to = res.nodes.find(x => x.name === res.edges[i].to)
					res.edges[i].from = from.id
					res.edges[i].to = to.id
				}
				
				// remove the nodes that are not connected
				const connectedNodes = []
				for (let i = 0; i < res.edges.length; i++) {
					connectedNodes.push(res.edges[i].from)
					connectedNodes.push(res.edges[i].to)
				}
				res.nodes = res.nodes.filter(x => connectedNodes.includes(x.id))

				console.log(h, "result from fetchAndProcessDataTitles", res)
				cb(res)

			})
		}

		/////////////////////////////////////////////
		//
		// HASHTAG METHOD
		//
		/////////////////////////////////////////////
		const fetchAndProcessDataHashtags = (cb) => {
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

						// if innerTagOption3 exists, find all nodes connected, then for each node connected, find all nodes connected to it, until no more nodes are connected in a recursive way
						if (innerTagOption3) {
							const findConnectedNodes = (nodeId, res) => {
								const connectedNodes = res.edges.filter(x => x.from === nodeId || x.to === nodeId)
								const connectedNodesIds = connectedNodes.map(x => x.from === nodeId ? x.to : x.from)
								return connectedNodesIds
							}
							const findConnectedNodesRecursive = (nodeId, res, resArr) => {
								// if nodeId is integer, convert to string
								// if (typeof nodeId === "number") nodeId = nodeId.toString()
								const connectedNodesIds = findConnectedNodes(nodeId, res)
								for (let i = 0; i < connectedNodesIds.length; i++) {
										const cid = connectedNodesIds[i]
										if (!resArr.includes(cid)) {
												resArr.push(cid)
												findConnectedNodesRecursive(cid, res, resArr)
										}
								}
							}
							const connectedNodesIds = []
							// find the root tag id
							const rootTagId = res.nodes.find(x => x.name === innerTagOption3).id?.toString()
							findConnectedNodesRecursive(rootTagId, res, connectedNodesIds)
							// filter nodes and edges
							// let res2 = {}
							res.nodes = res.nodes.filter(x => connectedNodesIds.includes(x.id.toString()))
							res.edges = res.edges.filter(x => connectedNodesIds.includes(x.from) && connectedNodesIds.includes(x.to))
							// res = res2
						}
						

						console.log(h, "result from fetchAndProcessDataHashtags", res)
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
								stabilization: false
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
				const createPopupWithData = createPopupNew(data);
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
		const isMobile = () => {
				let check = false;
				//@ts-ignore
				(function(a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
				return check;
		};
		const createPopupNew = data => d => {
				const nodeId = d.nodes[0]
				if (!nodeId) return
				const node = data.nodes.find(x => x.id === nodeId);

				const parts = node.noteParts
				// take first 
				let fileToOpen = parts[0].file
				let stringToSearch = node.label
				api.call("ui.floatingPanel.openFile", [fileToOpen.path, { 
					searchedString: stringToSearch,
					idpanel: 'id-panel-graph-preview',
					view: 'editor',	
					layout: isMobile() ? "top" : "top-right"
				}])
		}

		// const createPopup = data => d => {
		// 		const nodeId = d.nodes[0]
		// 		if (!nodeId) return
		// 		const node = data.nodes.find(x => x.id === nodeId);
		// 		const parts = node.noteParts
		// 		const popupTitle = `Hashtag "${node.name}" Research`
		// 		let toShow = `
		// 		<div id="popup-graph-wrapper">
		// 		"${node.label}" found in : <br>
		// 																<br>
		// 																<div class="links-wrapper">
		// 																`
		// 		window.wooop = (test) => {
		// 			console.log(test);
		// 			alert(test);
		// 		}
		// 		// const file
		// 		//
		// 		// JS RELATED FUNCTIONS => we are again in a popup context where all API is availabe
		// 		//
		// 		const popupFunctionStr = (file) => `
		// 			window.api.ui.floatingPanel.openFile('${file.path}', { 
		// 					searchedString:'${node.label}' , 
		// 					idpanel: 'id-panel-graph-preview', 
		// 					layout: 'top-right'
		// 			})
		// 																`
		// 		const openInActiveWindowStr = (file) => `window.api.ui.windows.active.setContent(${JSON.stringify(file).replaceAll('\"', '\'')}); `
		// 		const objsToDisplay = {}
		// 		for (let i = 0; i < parts.length; i++) {
		// 				if (!objsToDisplay[parts[i].file.name]) {
		// 						objsToDisplay[parts[i].file.name] = {
		// 								file: parts[i].file,
		// 								partsName: []
		// 						}
		// 				}
		// 				if (parts[i].titleName !== "") objsToDisplay[parts[i].file.name].partsName.push(parts[i].titleName)
		// 		}
		// 		toShow += `<ul class="notes-list">`
		// 		for (let key in objsToDisplay) {
		// 				const obj = objsToDisplay[key]
		// 				toShow += `<li><a href="#/" onclick="${popupFunctionStr(obj.file)}">`
		// 				toShow += `${obj.file.name}${obj.partsName.length === 0 ? "" : " in #"}${obj.partsName.join(" ,#")}`
		// 				toShow += `</a>  `
		// 				// toShow += `<a href="#/" onclick="${openInActiveWindowStr(obj.file)}"> > </a></li>`
		// 		}
		// 		toShow += `</ul>`
		// 		toShow += `</div>
		// 		<div id="popup-part-preview">
		// 		</div>
		// 		<style>
		// 		#popup-graph-wrapper .notes-list {
		// 				margin: 0px;
		// 				margin-left: 12px;
		// 				padding: 0px;
		// 		}
		// 		#popup-graph-wrapper {
		// 				text-align: left;
		// 		}
		// 		#popup-part-preview h3.note-title {
		// 				margin-bottom: 10px;
		// 				margin-top: 0px;
		// 		}
		// 		#popup-part-preview p {
		// 				margin: 0px;
		// 		}
		// 		#popup-part-preview ul,
		// 		#popup-part-preview li {
		// 				margin: 0px;
		// 		}
		// 		#popup-part-preview .found-word {
		// 				font-weight: bold;
		// 				background: #fff876;
		// 				padding: 2px;
		// 		}
		// 		#popup-part-preview img {
		// 				max-width: 300px;
		// 		}
		// 		#popup-part-preview .file-content {
		// 				padding: 10px 30px;
		// 		}
		// 		#popup-part-preview {
		// 				max-height: 50vh;
		// 				overflow-y: scroll;
		// 				background: gainsboro;
		// 				padding: 0px;
		// 				margin-top: 20px;
		// 		}
		// 		</style>
		// 		</div>
		// 		`
		// 		api.call("popup.show", [toShow, popupTitle])
		// }










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
				width: 120px;
				height: 20px;
				overflow: hidden;
				word-break: break-all;
				font-size: 10px;
				color:#a1a1a1;
		}
		</style>
		<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet"> 
		<div id="filter-graph-wrapper">
			<i class="fas fa-question-circle" style="color:#c2c2c2; cursor:pointer;" onclick='api.call("popup.show", [window.helpStrTable, "Table Help"])'></i>
			<i class="fas fa-sync-alt" style="color:#c2c2c2; cursor:pointer;" onclick="window.reloadGraph({disableCache:true})"></i>
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
										const scale = network.getScale() < 0.1 ? 0.7 : network.getScale()
										// const currentScale =  network.getScale()
										network.focus(`${guessed.id}`, { scale })
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


		window.reloadGraph = (p) => {
			let disableCache = p?.disableCache || false
			initFetchUserColor(() => {
				loadDatas(data => {
						initGraph(data, (network) => {
							initFilterInput(data, network);
							initExperienceFromDeviceType();
						})
					api.utils.resizeIframe(opts.size);
				}, {disableCache})
			})
		}



		///////////////////////////////////////////////////
		// 4. LIB LOAD + CTAG BOOT
		//
		api.utils.loadRessources(
				[
					'https://colorjs.io/dist/color.global.js',
					'https://visjs.github.io/vis-network/standalone/umd/vis-network.min.js',
				], () => {
					window.reloadGraph()
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
