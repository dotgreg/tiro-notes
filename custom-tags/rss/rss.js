const rssApp = (innerTagStr, opts) => {

		if (!opts) opts = {}
		if (!opts.size) opts.size = "95%"
		if (!opts.rssToJsonUrl) opts.rssToJsonUrl = "https://api.rss2json.com/v1/api.json?rss_url="

		const h = `[CTAG RSS] v1.0.4 30/09/22`
		//@ts-ignore
		const api = window.api;
		const { div, updateContent } = api.utils.createDiv();
		const divId = `rss-${api.utils.uuid()}`;

		console.log(h, "========= INIT with opts:", opts)

		const execRssReader = (feedsStr) => {
				const getFeeds = (str) => {
						const feedsArr = str.split('\n')
						const feedsRes = []
						for (let i = 0; i < feedsArr.length; i++) {
								const raw = feedsArr[i].trim().split(" ")
								if (raw.length !== 2) continue
								feedsRes.push({ name: raw[0], url: raw[1] })
						}
						console.log(h, "1: gettings feedsRefs Arr", feedsRes)
						return feedsRes
				}

				const cacheId = `ctag-rss-${api.utils.getInfos().file.path}`


				//
				// CACHING MECHANISM
				//
				const getCachedJsons = (cb) => {
						const hasUserReloaded = api.utils.getInfos().reloadCounter !== 0
						if (!hasUserReloaded) {
								// first get cached, if exists
								getCache(content => {
										// if cache, return content
										cb(content)
								}, () => {
										// if no cache OR expired, reload from json rss
										getJsons(cb)
								})
						} else {
								// directly reload without cache
								getJsons(cb)
						}
				}

				const getCache = (onSuccess, onFailure) => {
						api.call("cache.get", [cacheId], content => {
								if (content !== undefined) onSuccess(content)
								else onFailure()
						})
				}
				const setCache = (content) => {
						api.call("cache.set", [cacheId, content])
				}

				//
				// bookmarksORITES MECHANISM
				//
				const bookmarksId = `ctag-rss-bookmarks-${api.utils.getInfos().file.name}`
				const stateFolder = `/.tiro/.states`
				const pathBookmarksFile = `${stateFolder}/${bookmarksId}`

				let bookmarks = {current: []}
				const setBookmarks = (nBookmarksArr) => {
						let JSONObj = JSON.stringify(nBookmarksArr)
						api.call("file.saveContent", [pathBookmarksFile, JSONObj], content => {})
				}
				const getBookmarks = (cb) => {
						api.call("file.getContent", [pathBookmarksFile], rawContent => {
								let res = []
								if (rawContent !== "NO_FILE") {res = JSON.parse(rawContent)}
								bookmarks.current = res
								cb(res)
						})
				}
				const addBookmark = (item, cb) => {
						if (isArticleBookmark(item)) return console.log("do not add item, as already faved")
						getBookmarks(favsArr => {
								const nBookmarkArr = [...favsArr]
								nBookmarkArr.unshift(item)
								item.isBookmark = true
								setBookmarks(nBookmarkArr)
								bookmarks.current = nBookmarkArr
								cb(nBookmarkArr)
								console.log("ADD IN bookmarks", item, bookmarks.current);
						})
				}
				const removeBookmark = (item, cb) => {
						getBookmarks(favsArr => {
								const nBookmarkArr = [...favsArr]
								const nBookmarkArr2 = nBookmarkArr.filter(i => i.link !== item.link)
								setBookmarks(nBookmarkArr2)
								bookmarks.current = nBookmarkArr2
								cb(nBookmarkArr2)
								console.log("REMOVE FROM bookmarks",  bookmarks.current);
						})
				}
				const isArticleBookmark = (item) => {
						let res = false
						let favFilter = bookmarks.current.filter(i => i.link === item.link)
						if (favFilter.length > 0) res = true
						// console.log("IS bookmarks", item, res);
						return res
				}
				// init
				getBookmarks()

				//
				// FETCHING DATA
				//
				const getJsons = (cb) => {
						const feedsArr = getFeeds(feedsStr)
						const urlApi = opts.rssToJsonUrl
						let resItems = []
						let count = 0
						for (let i = 0; i < feedsArr.length; i++) {
								fetch(`${urlApi}${feedsArr[i].url}`)
										.then(response => {
												return response.json()
										})
										.then(data => {
												count = count + 1
												console.log(h, "1 debug els", feedsArr[i].url, data, count, feedsArr.length)

												if (Array.isArray(data.items)) {
														const nitems = [...data.items]
														for (let j = 0; j < nitems.length; j++) {
																nitems[j].sourceRss = feedsArr[i].name
																const timestamp = Date.parse(nitems[j].pubDate)
																const d = new Date(timestamp)
																//const datestring = d.getDate()  + "-" + (d.getMonth()+1) + "-" + d.getFullYear() + " " + d.getHours() + ":" + d.getMinutes();
																const datestring = d.getDate() + "/" + (d.getMonth() + 1) + " " + d.getHours() + ":" + d.getMinutes();

																nitems[j].timestamp = timestamp
																nitems[j].smallDate = datestring
																resItems.push(nitems[j])
														}
												}
												if (count === feedsArr.length) {
														// sort items by time
														console.log(h, "2: outputting elements taken from api")
														resItems = resItems.sort((a, b) => b.timestamp - a.timestamp)
														setCache(resItems)
														cb(resItems)
												}

										});
						}
				}

				const c = React.createElement;
				const ArticleDetail = (p) => {
						const [type, setType] = React.useState("text")

						React.useEffect(() => {
								// for mp3/podcasts
								if (
										p.article.enclosure.type &&
												p.article.enclosure.type.includes("audio")
								) setType("audio")
						}, [p.article])


						const bgColors = ["#264653", "#2A9D8F", "#E9C46A", "#F4A261", "#E76F51"]
						const cColor = bgColors[Math.floor(Math.random() * bgColors.length)];
						const bgImage = p.article.thumbnail || p.article.enclosure.link
						const openLinkNewWindow = (url) => {
								window.open(url, '_blank', 'location=yes,height=570,width=520,scrollbars=yes,status=no');
						}

						// bookmarks
						const [refresh, setRefresh]  = React.useState(0)
						const doRefresh = () => {
								setRefresh(refresh + 1)
								p.onBookmarkToggle()
						}
						let isBookmark = isArticleBookmark(p.article)

						return (
								c('div', { className: "article-details-wrapper" }, [
										c('div', { className: "article-close", onClick: () => { p.onClose() } }, ["x"]),
										c('div', { className: `article-bookmark-toggle ${isBookmark ? "fav":"not-fav"}`,
															 onClick: () => {
																	 if (isBookmark) removeBookmark(p.article, doRefresh)
																	 else addBookmark(p.article, doRefresh)
															 }
														 },
											`${!isBookmark ? "★":"★"}`),
										c('div', { className: "article-title" }, [p.article.title]),
										c('div', {
												className: "bg-image",
												style: {
														backgroundImage: "url(" + bgImage + ")",
														backgroundColor: cColor
												}
										}),
										c('div', { className: "article-content-wrapper" }, [
												c('div', { className: "article-time" }, [
														p.article.pubDate + " - " + p.article.sourceRss
												]),
												c('div', {
														className: "article-description",
														dangerouslySetInnerHTML: { __html: p.article.description }
												}),
												c('br'),
												p.article.content !== p.article.description && c('div', {
														className: "article-description",
														dangerouslySetInnerHTML: { __html: p.article.content }
												}),
										]),
										type !== "audio" && c('a', { className: "article-link", href: p.article.link, target: "_blank" }, ["link"]),
										type === "audio" &&
												c('div', { className: "audio-wrapper", }, [
														c('audio', { controls: "true" }, [
																c('source', {
																		src: p.article.enclosure.link,
																		type: p.article.enclosure.type
																})
														]),
														c('a', { className: "article-link", href: p.article.enclosure.link, target: "_blank" }, ["audio file"]),
												])
								])
						)
				};

				const App = () => {
						const titems = React.useRef([])
						const [items, setItems] = React.useState([])
						const [filteredItems, setFilteredItems] = React.useState([])
						const [itemActive, setItemActive] = React.useState(null)
						const [feeds, setFeeds] = React.useState([])
						const [activeFeed, setActiveFeed] = React.useState("all")
						React.useEffect(() => {
								getBookmarks(() => {
										getCachedJsons(nitems => {
												console.log(h, "3 updating list (should happen twice, 1st cached, second from internet");

												const i = [...nitems]
												setItems(i)
												titems.current = i

												const nfeeds = []
												for (let i = 0; i < nitems.length; i++) {
														const it = nitems[i];
														if (!nfeeds.includes(it.sourceRss)) nfeeds.push(it.sourceRss)
												}
												setFeeds(nfeeds)
												setActiveFeed(null)
												// console.log(223331,nitems, titems.current);
										})
								})
						}, [])

						const [refresh, setRefresh]  = React.useState(0)
						const doRefresh = () => {	setRefresh(refresh + 1)}
						React.useEffect(() => {
								const nitems = []
								if (activeFeed === "bookmarks") {
										console.log(bookmarks.current);
										setFilteredItems(bookmarks.current)
								} else {
										for (let i = 0; i < items.length; i++) {
												const it = items[i];
												if (activeFeed === null) nitems.push(it)
												else if (it.sourceRss === activeFeed) nitems.push(it)
										}
										setFilteredItems(nitems)
								}
						}, [activeFeed, refresh])



						return (
								c('div', { className: "rss-app-wrapper" }, [

										c('div', { className: `filter-list-wrapper` }, [
												c('select', {
														onChange: e => {
																let val = e.target.value
																if (val === "all") val = null
																setActiveFeed(val)
																console.log(223331, val);
														}
												}, [
														c('option', { value: "all" }, [`-- all -- `]),
														c('option', { value: "bookmarks" }, [`-- bookmarks -- `]),
														feeds.map(feed =>
																c('option', { value: feed }, [`${feed}`])
														)
												]),
										]),
										c('div', { className: `articles-list ${itemActive ? 'item-active-open' : ''}` }, [
												filteredItems.map(item =>
														c('div', {
																className: "article-list-item",
																onClick: () => { setItemActive(item) }
														},
															[`[${isArticleBookmark(item) ? "⭑":""} ${item.sourceRss} ${item.smallDate}] ${item.title} `]
														 ),
												)
										]),

										itemActive && c(ArticleDetail, {
												article: itemActive,
												onClose: () => {
														setItemActive(null)
												},
												onBookmarkToggle: () => {
														doRefresh()
												}
										}, []),
								])
						);
				}
				// console.log(ReactDOM, React);

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
						console.log(h, "0: react loaded, starting script with innertag:", innerTagStr)
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
				height: 100%;
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
				font-size: 16px;
				font-weight: bold;
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
				background: white;
				position: relative;
				padding: 18px;
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
				margin-bottom: 30px;
				display: block;
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
		.article-bookmark-toggle.fav {
				color: #e9cd3f;
		}
		.article-bookmark-toggle {
				color: grey;
				position: fixed;
				right: 40px;
				top: 7px;
				cursor: pointer;
				z-index: 2;
				background: rgba(255,255,255,1);
				box-shadow: 0px 0px 17px rgb(0 0 0 / 55%);
				padding: 2px 9px;
				border-radius: 30px;
				font-size: 10px;
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
		/* FILTER  */
		.filter-list-wrapper {
				display: flex;
				flex-direction: row-reverse;
				padding-bottom: 5px;
				padding-right: 5px;
		}
		.filter-list-wrapper select {
		}

		/* LIST  */
		.articles-list.item-active-open {
				width: calc(50% - 30px);
		}
		.articles-list {
				width: 100%;
				overflow-x: hidden;
				height: 100%;
				overflow-y: scroll;
		}
		@media screen and (max-width: 500px) {
				.articles-list {
						width: 100%;
				}
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
