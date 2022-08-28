const graphApp = (innerTagStr, opts) => {
	const infos = api.utils.getInfos()

	// update content every x seconds
	if (!opts) opts = {}
	if (!opts.size) opts.size = "300px"

	const h = `[GRAPH CTAG] 1.0.0 27/08/22`
	console.log(h, "init CTAG ");

	//
	// 1. DATA
	//
	const loadDatas = (cb) => {
		api.call("search.hashtags", ["/test_obsi"], hashtags => {
			const res = {}

			// preparing nodes
			res.nodes = hashtags.nodesArr
			for (let i = 0; i < res.nodes.length; i++) {
				res.nodes[i].label = res.nodes[i].name
			}
			// preparing edges
			res.edges = []
			const edges = hashtags.edges
			for (let y = 0; y < edges.length; y++) {
				const edge = edges[y].split("-")
				res.edges.push({ from: edge[0], to: edge[1] })
			}
			// console.log(2221, res);
			cb(res)
		});
	}

	//
	// 2. GRAPH INIT
	//
	const initGraph = (data, cb) => {
		var container = document.getElementById("mynetwork");
		// var data = {
		// 		nodes: nodes,
		// 		edges: edges,
		// };
		var options = {
			// physics: {
			// barnesHut: { gravitationalConstant: -30000 },
			// stabilization: { iterations: 2500 },
			// },
			// clickToUse: true,
			autoResize: true,
			height: '100%',
			width: '100%',
			physics: {
				enabled: false,
			},
			edges: {
				smooth: false,
			},
			nodes: {
				shape: "dot",
				size: 16,
			},

		};
		var network = new vis.Network(container, data, options);
		network.on("click", d => {
			const nodeId = d.nodes[0]
			if (!nodeId) return
			const node = data.nodes.find(x => x.id === nodeId);
			console.log(2225, node);

			const parts = node.noteParts
			let toShow = `
<div id="popup-graph-wrapper">
"${node.label}" found in ${parts.length} parts of notes : <br>
============<br>
<div class="links-wrapper">
								`
			// console.log(2226, window.api, '${infos.windowId}')
			const popupFunctionStr = (file) => `
window.api.file.getContent('${file.path}', ncontent => {
  document.getElementById('popup-part-preview').innerHTML = ncontent
})
`
			for (let i = 0; i < parts.length; i++) {
				toShow += `<a href="#" onclick="${popupFunctionStr(parts[i].file)}">`
				toShow += `${parts[i].file.path} #${parts[i].titleName} `
				toShow += `</a> \n<br>`
			}

			toShow += `</div>
<div id="popup-part-preview">
</div>
<style>
#popup-graph-wrapper {
    text-align: left;
}
#popup-part-preview {
    max-height: 50vh;
    overflow-y: scroll;
    background: gainsboro;
    padding: 10px;
    margin-top: 20px;
    white-space: pre-line;
}
</style>
</div>
						`
			// api.call("popup.confirm", [toShow])
			api.call("popup.confirm", [toShow])

		})
	}


	//
	// 3. LIB LOAD
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
