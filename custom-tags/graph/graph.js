const graphApp = (innerTagStr, opts) => {
		const folderPath = innerTagStr.trim()
		const infos = api.utils.getInfos()
		if (!opts) opts = {}
		if (!opts.size) opts.size = "300px"
		const h = `[GRAPH CTAG] 1.0.0 27/08/22`

		if (!folderPath.startsWith("/")) return console.error (h, "folderpath should start by a '/'")
		console.log(h, "init CTAG with folder:", folderPath);
		// const folder = "/test_obsi"





		// TODO : to get only clicked connections highlighted https://codepen.io/pen?editors=1010
		///////////////////////////////////////////////////
		// 0. COLOR
		//
		function hexToRgbArr(hex) {
				var c;
				if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
						c = hex.substring(1).split('');
						if (c.length == 3) {
								c = [c[0], c[0], c[1], c[1], c[2], c[2]];
						}
						c = '0x' + c.join('');
						return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
				}
				throw new Error('Bad Hex');
		}

		let mainColorHex = "";
		api.call("userSettings.get", ['ui_layout_colors_main'], color => {
				mainColorHex = color
		});

		const getMainColor = (opacity, variation) => {
				// console.log(222444, mainColorHex, opacity, hexToRgbArr(mainColorHex, opacity));
				let rgb = hexToRgbArr(mainColorHex)
				if (!variation) variation = [0, 0, 0]
				let v = variation
				let str = `rgba(${rgb[0] + v[0]},${rgb[1] + v[1]},${rgb[2] + v[2]},${opacity})`
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
								res => {cb(res)},
								() => {fetchAndProcessData(cb)}
						)
				}
		}

		// CACHING MECHANISM
		const cacheId = `ctag-graph-${folderPath}`
		const getCache = (onSuccess, onFailure) => {
				console.log(111, "getcache", cacheId);
				api.call("cache.get", [cacheId], content => {
						console.log(1122, "getcache", cacheId, content);
						if(content !== undefined) onSuccess(content)
						else onFailure()
				})
		}
		const setCache = (content) => {
				api.call("cache.set", [cacheId, content])
		}

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
						setCache(res)
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
								improvedLayout: true,
								hierarchical: {
										enabled: false,
								}
						},

						autoResize: true,
						height: '100%',
						width: '100%',
						physics: {
								enabled: true,
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
										background: getMainColor(1, [0, 0, 50]),
										// highlight: {
										// 	border: "#ff0000",
										// 	background: "#ff0000",
										// }
								}
						},

				};
				var network = new vis.Network(container, data, options);
				const createPopupWithData = createPopup(data);
				network.on("click", createPopupWithData);
				cb(network);
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
				// console.log(2226, window.api, '${infos.windowId}')
				// const file
				const popupFunctionStr = (file) => `
window.api.file.getContent('${file.path}', ncontent => {
ncontent2 = window.api.note.render({raw: ncontent, file: ${JSON.stringify(file).replaceAll('\"', '\'')}, windowId:''})
	ncontent2 = ncontent2.replaceAll('${node.name}', '<span>${node.name}</span>')
	document.getElementById('popup-part-preview').innerHTML = '<h3>${file.path}</h3>' + ncontent2
})
`
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
				
				// console.log(2225, parts, objsToDisplay);

				toShow += `<ul class="notes-list">`
				for ( let key in objsToDisplay) {
						const obj = objsToDisplay[key]
						toShow += `<li><a href="#" onclick="${popupFunctionStr(obj.file)}">`
						toShow += `${obj.file.name}${obj.partsName.length === 0 ? "": " in #"}${obj.partsName.join(" ,#")}`
						toShow += `</a></li>`
				}
				toShow += `</ul>`

				// for (let i = 0; i < parts.length; i++) {
				// 		toShow += `<a href="#" onclick="${popupFunctionStr(parts[i].file)}">`
				// 		toShow += `${parts[i].file.name} #${parts[i].titleName} `
				// 		toShow += `</a> \n<br>`
				// }

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
#popup-part-preview span {
   font-weight: bold;
    background: #fff876;
    padding: 2px;
}
#popup-part-preview img {
	max-width: 300px;
}
#popup-part-preview {
    max-height: 50vh;
    overflow-y: scroll;
    background: gainsboro;
    padding: 10px 30px;
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
		right: 0px;
		top: 0px;
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

				let lastval = ''
				let lastid = 0
				filterInput && filterInput.addEventListener("keydown",  e => {
						const isEnter = e.key === "Enter"

						setTimeout(() => {
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
										if (resArr.length > 0) {resGuess = `${lastid +1}/${resArr.length} : "${guessed.name}"`}
										// focus and select it
										const scale = network.getScale() < 0.1 ? 0.5 : network.getScale() 
										network.focus(`${guessed.id}`, {scale: 0.5})
										network.selectNodes([guessed.id])
								} else {
										// dezoom
										network.moveTo({position: {x: 0, y:0}, scale: 0.1})
								}

								// console.log(333, resArr, val, resGuess);
								bestGuessEl.innerHTML = resGuess
						}, 10)


				});
		}





		///////////////////////////////////////////////////
		// 4. LIB LOAD + CTAG BOOT
		//
		api.utils.loadRessources(
				[
						'https://visjs.github.io/vis-network/standalone/umd/vis-network.min.js',
				], () => {
						loadDatas(data => {
								api.utils.resizeIframe(opts.size);
								initGraph(data, (network) => {
										initFilterInput(data, network);
										initExperienceFromDeviceType();
								})
						})
				}
		)


		// mobile, input
		const initExperienceFromDeviceType = () => {
				const mobileAndTabletCheck = function() {
						let check = false;
						(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
						return check;
				};
				const classWrapper = mobileAndTabletCheck() ? "is-mobile" : "is-desktop"
				document.getElementById('network-wrapper').classList.add(classWrapper);
		}

		const styleHtml = `<style>
				html, body, .with-padding, #mynetwork  {
						width: 100%;
						height: ${opts.size};
				}
		</style>
		`
		return `
${styleHtml}
<div id="network-wrapper">
		<div id="popup"></div>
		${inputFilterHtml}
		<div id="mynetwork"></div>
</div>
`
}

window.initCustomTag = graphApp
