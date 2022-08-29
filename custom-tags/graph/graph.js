const graphApp = (innerTagStr, opts) => {
	const folderPath = innerTagStr.trim()
	const infos = api.utils.getInfos()
	if (!opts) opts = {}
	if (!opts.size) opts.size = "300px"
	const h = `[GRAPH CTAG] 1.0.0 27/08/22`
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
		api.call("search.hashtags", [folderPath], hashtags => {
			const res = {}
			// inital node to connect them all
			// const initNode = {
			// 	label: folder,
			// 	id: 0,
			// }

			// preparing nodes
			res.nodes = hashtags.nodesArr
			for (let i = 0; i < res.nodes.length; i++) {
				res.nodes[i].label = res.nodes[i].name
				const nbParts = res.nodes[i].noteParts.length
				// increase group repulsion to other non connected groups
				const mass = 1
				res.nodes[i].mass = mass
				// size node according to nb of apparition
				let size = 5 + (nbParts * 5)
				size = clamp(size, 5, 30)
				res.nodes[i].size = size
			}
			// res.nodes.push(initNode)


			// preparing edges
			res.edges = []
			const edges = hashtags.edges
			for (let y = 0; y < edges.length; y++) {
				const edge = edges[y].split("-")
				res.edges.push({ from: edge[0], to: edge[1] })

				// all connects to 0?
				// res.edges.push({ from: 0, to: edge[0] })
			}
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
		const createPopupWithData = createPopup(data)
		network.on("click", createPopupWithData)
	}










	///////////////////////////////////////////////////
	// 3. CREATE POPUP
	//
	const createPopup = data => d => {
		const nodeId = d.nodes[0]
		if (!nodeId) return
		const node = data.nodes.find(x => x.id === nodeId);
		console.log(2225, node);

		const parts = node.noteParts
		const popupTitle = `Hashtag "${node.name}" Research`
		let toShow = `
<div id="popup-graph-wrapper">
"${node.label}" found in ${parts.length} parts of notes : <br>
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
		for (let i = 0; i < parts.length; i++) {
			toShow += `<a href="#" onclick="${popupFunctionStr(parts[i].file)}">`
			toShow += `${parts[i].file.name} #${parts[i].titleName} `
			toShow += `</a> \n<br>`
		}

		toShow += `</div>
<div id="popup-part-preview">
</div>
<style>
#popup-graph-wrapper {
    text-align: left;
    
}
#popup-part-preview h3.note-title {
    margin-bottom: 10px;
    margin-top: 0px;
}
#popup-part-preview ul,
#popup-part-preview li,
#popup-part-preview p {
		margin: 0px;
		padding: 0px;
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
	// 4. LIB LOAD + CTAG BOOT
	//
	api.utils.loadRessources(
		[
			'https://visjs.github.io/vis-network/standalone/umd/vis-network.min.js',
		], () => {
			loadDatas(data => {
				api.utils.resizeIframe(opts.size);
				initGraph(data)
			})
		}
	)


	const styleHtml = `<style>
				html, body, .with-padding, #mynetwork  {
						width: 100%;
						height: ${opts.size};
				}
		</style>
		`
	return `
${styleHtml}
<div id="popup"></div>
<div id="mynetwork"></div>
`
}

window.initCustomTag = graphApp
