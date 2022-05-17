const rssApp = (innerTagStr, opts) => {

		if (!opts) opts = {}
		if (!opts.size) opts.size =  "95%"

		const h = `[CTAG RSS] 0431 v1.1`
		const api = window.api;
		const { div, updateContent } = api.utils.createDiv();
		const divId = `rss-${api.utils.uuid()}`;

		console.log(h,"========= INIT with opts:", opts) 

		const execRssReader = (feedsStr) => {

				const getFeeds = (str) => {
						const feedsArr = str.split('\n')
						const feedsRes = []
						for(let i = 0; i < feedsArr.length; i++) {
								const raw = feedsArr[i].trim().split(" ")
								if (raw.length !== 2) continue
								feedsRes.push({name: raw[0], url: raw[1]})
						}
						console.log(h,"1: gettings feedsRefs Arr", feedsRes) 
						return feedsRes
				}

				const getJsons = (cb) => {
						const feedsArr = getFeeds(feedsStr)
						const urlApi = "https://api.rss2json.com/v1/api.json?rss_url="
						let resItems = []
						for(let i = 0; i < feedsArr.length; i++) {
								fetch(`${urlApi}${feedsArr[i].url}`)
										.then(response => response.json())
										.then(data => {
												const nitems = [...data.items]
												for(let j = 0; j < nitems.length; j++) { 
														nitems[j].sourceRss = feedsArr[i].name
														const timestamp = Date.parse(nitems[j].pubDate)
														const d = new Date(timestamp)
														//const datestring = d.getDate()  + "-" + (d.getMonth()+1) + "-" + d.getFullYear() + " " + d.getHours() + ":" + d.getMinutes();
														const datestring = d.getDate()  + "/" + (d.getMonth()+1) + " " + d.getHours() + ":" + d.getMinutes();

														nitems[j].timestamp = timestamp
														nitems[j].smallDate = datestring
														resItems.push(nitems[j])
												}
												if (i === feedsArr.length - 1) { 
														// sort items by time
														console.log(h,"2: outputting elements taken from api") 
														resItems = resItems.sort((a, b) => b.timestamp - a.timestamp)
														cb(resItems)
												}
										}); 
						}
				}

				const c = React.createElement;
				const ArticleDetail = (p) => {
						React.useEffect(() => {
						}, [p.article])
						return (
								c('div', { className:"article-details-wrapper" }, [ 
										c('div', { className:"article-close", onClick: () => { p.onClose()} }, [ "x" ]),
										c('h3', { className:"article-title" }, [ p.article.title ]),
										c('div', {className:"article-content-wrapper"  }, [ 
												c('div', { className:"article-time" }, [ 
														p.article.pubDate + " - " + p.article.sourceRss 
												]),
												c('div', { 
														className:"article-description",
														dangerouslySetInnerHTML:{ __html: p.article.description }
												}),
												c('br'),
												p.article.content !== p.article.description && c('div', { 
														className:"article-description",
														dangerouslySetInnerHTML:{ __html: p.article.content }
												}),
												c('div', {
														className:"bg-image", 
														src: p.article.enclosure.link,
														style: {backgroundImage: "url(" + p.article.enclosure.link + ")" }
												}),
										]),
										c('a', { className:"article-link", href:p.article.link, target:"_blank" }, [ "link" ]),
								])
						)
				};

				const App = () => {
						const [items, setItems] = React.useState([])
						const [itemActive, setItemActive] = React.useState(null)
						React.useEffect(() => {
								getJsons(nitems => {
										const i = [...nitems]
										setItems(i)
								})
						},[])
						return (
								c('div', { className: "rss-app-wrapper" }, [

										c('div', { className: "articles-list" }, [
												items.map( item =>
														c('div', { 
																className: "article-list-item", 
																onClick: () => {setItemActive(item)} }, 
															[ `[${item.sourceRss} ${item.smallDate}] ${item.title}` ]
														 ),
												)
										]),

										itemActive && c(ArticleDetail, { 
												article: itemActive,
												onClose: () => {
														setItemActive(null)
												}
										}, []),
								])
						);
				}

				ReactDOM.render(
						c(App),
						document.getElementById("root-react")
				);
		}

		api.utils.loadScripts(
				[
						"https://unpkg.com/react@18/umd/react.production.min.js",
						"https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"
				],
				() => {
						console.log(h,"0: react loaded, starting script with innertag:", innerTagStr) 
						execRssReader(innerTagStr)
						setTimeout(() => {
								api.utils.resizeIframe(opts.size);
						}, 100);
				}
		);

		const styleRss = `
	html, body,
	#root-react {
		height: 100vh;
		overflow: hidden;
	}
	body {
		font-family: sans-serif;
		padding: 0px;
		margin: 0px;
	}
	.rss-app-wrapper {
		position: relative;
		height: 100%;
	}
	/* DETAILS  */
	.article-details-wrapper {
		width: 50%;
		padding: 15px;
		position: absolute;
		background: white;
		height: calc(100% - 110px);
		overflow-y: scroll;
		right: 0px;
		top: 0px;
		box-shadow: 0px 0px 17px rgb(0 0 0 / 25%);
	}
	@media screen and (max-width: 500px) {
		.article-details-wrapper {
			width: calc(100% - 30px);
		}
	}
	.article-title {
		position: relative;
		z-index: 1;
		background: white;
		padding: 10px;
		margin-top: 80px;
		font-size: 16px;
	}
	.article-time {
			color: grey;
			font-size: 10px;
			font-weight: 800;
		position: relative;
		bottom: 10px;
	}
	.article-content-wrapper {
			padding-top: 16px;
	}
	.article-content-wrapper img { 
			height: auto;
	}
	.article-description {
		color: grey;
		font-size: 12px;
	}
	.article-link {
		font-size: 12px;
		padding-bottom: 30px;
	}
	.bg-image {
		width: 30%;
		height: 150px;
		position: absolute;
		width: 100%;
		top: 0px;
		left: 0px;
		z-index: 0;
		background-size: cover;
		background-color: lightslategrey;
	}
	.article-close {
		position: fixed;
		right: 10px;
		top: 7px;
		cursor: pointer;
		z-index: 2;
		background: rgba(255,255,255,1);
		box-shadow: 0px 0px 17px rgb(0 0 0 / 55%);
		padding: 2px 9px;
		border-radius: 30px;
		color: grey;
		font-size: 10px;
	}
	/* LIST  */
	.articles-list {
		width: 100%;
		overflow-x: hidden;
		height: 100%;
		overflow-y: scroll;
	}
	.article-list-item {
		//width: 1000%;
		padding: 5px 10px;
		font-size: 11px;
		line-height: 14px;
	}
	.article-list-item:hover {
		color: blue;
		cursor: pointer;
	}
	.article-list-item:nth-child(even) {background: #CCC}
	.article-list-item:nth-child(odd) {background: #EEE}
	`;

		return `
	<div id='root-react'></div>
	<style>
			${styleRss}
	</style>
	`
}

window.initCustomTag = rssApp
