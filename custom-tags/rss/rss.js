const rssApp = (innerTagStr, opts) => {

	if (!opts) opts = {}
	if (!opts.size) opts.size = "95%"
	if (!opts.itemsPerFeed) opts.itemsPerFeed = 100
	// if (!opts.preprocessItems) opts.preprocessItems = (url, items) => { return items }
	// if (!opts.fetchItems) opts.fetchItems = (url) => { return items }

	// VERSION 1.0.6 22/02/23`
	const h = `[CTAG RSS]`

	//@ts-ignore
	const api = window.api;
	const { div, updateContent } = api.utils.createDiv();
	const divId = `rss-${api.utils.uuid()}`;

	console.log(h, "========= INIT with opts:", opts)

	const execRssReader = (feedsStr) => {
		const getFeeds = (str) => {
			const feedsArr = str.split('\n')
			const feedsRes = []
			// console.log(feedsArr);
			for (let i = 0; i < feedsArr.length; i++) {
				const raw = feedsArr[i].trim().split("|")
				if (raw.length < 2) continue
				let categories = []
				if (raw[2]) categories = raw[2].split(",")
				let limitFetchNb = opts.itemsPerFeed
				if (raw[3]) limitFetchNb = parseInt(raw[3]) || opts.itemsPerFeed
				feedsRes.push({ name: raw[0].trim(), url: raw[1].trim(), categories, limitFetchNb })
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









		//////////////////////////////////////////////////////////////////////////////////////////////////
		// bookmarksORITES MECHANISM
		//
		const bookmarksId = `ctag-rss-bookmarks-${api.utils.getInfos().file.name}`
		const stateFolder = `/.tiro/.states`
		const pathBookmarksFile = `${stateFolder}/${bookmarksId}`

		let bookmarks = { current: [] }
		const setBookmarks = (nBookmarksArr) => {
			let JSONObj = JSON.stringify(nBookmarksArr)
			api.call("file.saveContent", [pathBookmarksFile, JSONObj], content => { })
		}
		const getBookmarks = (cb) => {
			api.call("file.getContent", [pathBookmarksFile], rawContent => {
				let res = []
				if (rawContent !== "NO_FILE") { res = JSON.parse(rawContent) }
				bookmarks.current = res
				if (cb) cb(res)
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
				console.log("REMOVE FROM bookmarks", bookmarks.current);
			})
		}
		const isArticleBookmark = (item) => {
			let res = false
			let favFilter = bookmarks.current.filter(i => i.link === item.link)
			if (favFilter.length > 0) res = true
			return res
		}
		// init
		// setTimeout(() =>)
		getBookmarks()









		//////////////////////////////////////////////////////////////////////////////////////////////////
		// FETCHING DATA
		//

		// function debounce(func, timeout = 300) {
		// 	let timer;
		// 	return (...args) => {
		// 		clearTimeout(timer);
		// 		timer = setTimeout(() => { func.apply(this, args); }, timeout);
		// 	};
		// }
		// const debounceUpdateList = debounce(() => {
		// }, 4000)

		const getJsons = (cb) => {
			const feedsArr = getFeeds(feedsStr)
			let resItems = []
			let count = 0
			for (let i = 0; i < feedsArr.length; i++) {
				fetchFeedItems(feedsArr[i], items => {
					count = count + 1
					let feedItems = 0
					if (Array.isArray(items)) {
						const nitems = [...items]
						const g = (o) => {
							if (!o) return null
							if (typeof o === "string" || typeof o === "number") return o
							return o._text || o._cdata
						}
						for (let j = 0; j < nitems.length; j++) {
							// SOURCE
							nitems[j].sourceRss = feedsArr[i].name
							// TITLE

							nitems[j].title = g(nitems[j].title)
							// DESCRIPTION
							nitems[j].description = g(nitems[j].description) || ""
							// CONTENT
							nitems[j].content = g(nitems[j].content) || ""
							// LINK
							nitems[j].link = g(nitems[j].link) || g(nitems[j].enclosure?.link) || ""


							// TIME
							if (nitems[j]["dc:date"]) nitems[j].pubDate = nitems[j]["dc:date"]
							const timestamp = Date.parse(g(nitems[j].pubDate))
							const d = new Date(timestamp)
							const datestring = d.getDate() + "/" + (d.getMonth() + 1) + " " + d.getHours() + ":" + d.getMinutes();
							nitems[j].timestamp = timestamp
							nitems[j].smallDate = datestring
							// COLOR
							const bgColors = ["#264653", "#2A9D8F", "#E9C46A", "#F4A261", "#E76F51"]
							const cColor = bgColors[Math.floor(Math.random() * bgColors.length)];
							nitems[j].bgColor = cColor
							// IMAGE
							const bgImage = g(nitems[j].thumbnail) ||
								g(nitems[j].enclosure?.link) ||
								nitems[j]["media:content"]?._attributes?.url ||
								nitems[j]["itunes:image"]?._attributes?.href ||
								nitems[j].image
							nitems[j].image = bgImage
							// ENCLOSURE
							if (!nitems[j].enclosure) nitems[j].enclosure = {}
							else if (nitems[j].enclosure?._attributes) nitems[j].enclosure = { ...nitems[j].enclosure._attributes }

							resItems.push(nitems[j])
						}
						feedItems = nitems
					}
					console.log(h, `feed loaded ${count}/${feedsArr.length} : ${feedsArr[i].name} => ${feedItems.length} els`);
					// if (count === feedsArr.length) {
					// sort items by time
					resItems = resItems.sort((a, b) => b.timestamp - a.timestamp)
					setCache(resItems)
					cb(resItems)
					// }
				})
			}
		}

		const fetchFeedItems = (feed, cb) => {
			if (opts.fetchItems) {
				console.log(h, "CUSTOM FETCH FN detected");
				opts.fetchItems(feed, cb)
			}
			else getXml(feed, cb)
		}
		const getXml = (feed, cb) => {
			api.call("ressource.fetch", [feed.url, { disableCache: true }], txt => {
				let res2 = xml2js(txt, { compact: true })
				let items = res2.rss?.channel.item

				if (!items) items = []
				items = items.slice(0, feed.limitFetchNb)

				cb(items)
			})
		}












		///////////////////////////////////////////////////////////////////////////////////////
		// ARTICLE VIEW
		//
		const c = React.createElement;
		const ArticleDetail = (p) => {
			const [type, setType] = React.useState("text")

			React.useEffect(() => {
				// for mp3/podcasts
				if (
					p.article.enclosure.type &&
					p.article.enclosure.type.includes("audio")
				) setType("audio")
				if (
					p.article.enclosure.type &&
					p.article.enclosure.type.includes("video")
				) setType("video")
			}, [p.article])


			// const bgColors = ["#264653", "#2A9D8F", "#E9C46A", "#F4A261", "#E76F51"]
			// const cColor = bgColors[Math.floor(Math.random() * bgColors.length)];
			// const bgImage = p.article.thumbnail || p.article.enclosure.link
			const openLinkNewWindow = (url) => {
				window.open(url, 'rss_window', 'location=yes,height=670,width=820,scrollbars=yes,status=no');
			}

			// bookmarks
			const [refresh, setRefresh] = React.useState(0)
			const doRefresh = () => {
				setRefresh(refresh + 1)
				p.onBookmarkToggle()
			}
			let isBookmark = isArticleBookmark(p.article)

			return (
				c('div', { className: "article-details-prewrapper" }, [
					c('div', { className: "article-details-bg", onClick: e => { p.onClose(); } }, []),
					c('div', { className: "article-details-wrapper" }, [
						c('div', { className: "article-close", onClick: () => { p.onClose() } }, ["x"]),
						c('div', {
							className: `article-bookmark-toggle ${isBookmark ? "fav" : "not-fav"}`,
							onClick: () => {
								if (isBookmark) removeBookmark(p.article, doRefresh)
								else addBookmark(p.article, doRefresh)
							}
						},
							`${!isBookmark ? "★" : "★"}`),
						c('div', { className: "article-title" }, [p.article.title]),
						c('div', {
							className: "bg-image",
							style: {
								backgroundImage: "url(" + p.article.image + ")",
								backgroundColor: p.article.bgColor
							}
						}),
						c('div', { className: "article-content-wrapper" }, [
							c('div', { className: "article-time" }, [
								p.article.smallDate + " - " + p.article.sourceRss
							]),

							//
							// ARTICLE LINKS
							//
							type === "text" &&
							c('div', { className: "article-links-wrapper" }, [
								c('a', { className: "article-link", href: p.article.link, target: "_blank" }, ["link"]),
								c('a', {
									className: "article-link",
									onClick: () => { openLinkNewWindow(p.article.link) }
								}, ["open in window"]),
							]),
							//
							// AUDIO PLAYER
							//
							type === "audio" &&
							c('div', { className: "audio-wrapper", }, [
								c('audio', { controls: "true" }, [
									c('source', {
										src: p.article.enclosure.link || p.article.enclosure.url,
										type: p.article.enclosure.type
									})
								]),

								c('div', { className: "article-links-wrapper" }, [
									c('a', { className: "article-link", href: p.article.enclosure.link || p.article.enclosure.url, target: "_blank" }, ["audio file"]),
									c('a', {
										className: "article-link",
										onClick: () => { openLinkNewWindow(p.article.link) }
									}, ["open in window"]),
								])
							]),
							//
							// VIDEO PLAYER
							//
							type === "video" &&
							c('div', { className: "video-wrapper" }, [
								c('iframe', {
									src: p.article.enclosure.videoUrl,
									frameborder: "0",
									allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
								}, []),

								c('div', { className: "article-links-wrapper" }, [
									c('a', {
										className: "article-link",
										onClick: () => {
											openLinkNewWindow(p.article.link)
										}
									}, ["open in window"]),
								])
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

					])
				])
			)
		};









		////////////////////////////////////////////////////////////////////////////////
		// LIST VIEW
		//
		function shuffle(array) {
			let currentIndex = array.length, randomIndex;

			// While there remain elements to shuffle.
			while (currentIndex != 0) {

				// Pick a remaining element.
				randomIndex = Math.floor(Math.random() * currentIndex);
				currentIndex--;

				// And swap it with the current element.
				[array[currentIndex], array[randomIndex]] = [
					array[randomIndex], array[currentIndex]];
			}

			return array;
		}
		const sortArray = (arr, method) => {
			let nArr = [...arr]
			if (method === "random") {
				nArr = shuffle(nArr)
			} else if (method === "date") {
				nArr = nArr.sort((a, b) => b.timestamp - a.timestamp)
			}
			return nArr
		}

		const App = () => {

			const titems = React.useRef([])
			const [items, setItems] = React.useState([])

			const [search, setSearch] = React.useState("")
			const [searchItems, setSearchItems] = React.useState([])


			const [filteredItems, setFilteredItems] = React.useState([])
			const [itemActive, setItemActive] = React.useState(null)
			const [feeds, setFeeds] = React.useState([])
			const [activeFeed, setActiveFeed] = React.useState("all")

			//
			// SORTING
			//
			const [sort, setSort] = React.useState("date")
			const loopSort = () => {
				let method = sort === "date" ? "random" : "date"
				setItems(sortArray(items, method))
				setSort(method)
			}


			React.useEffect(() => {
				let nItems = []
				// console.log(3333333, filteredItems);
				if (filteredItems.length === 0) return
				for (let i = 0; i < filteredItems.length; i++) {
					let a = filteredItems[i]
					let searchee = a.title.toLowerCase() + a.content.toLowerCase() + a.sourceRss.toLowerCase()
					if (searchee.includes(search.toLowerCase())) {
						nItems.push(a)
					}
				}
				setSearchItems(nItems)
			}, [search, filteredItems])


			React.useEffect(() => {
				getBookmarks(() => {
					getCachedJsons(nitems => {
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
					})
				})
			}, [])

			const [refresh, setRefresh] = React.useState(0)
			const doRefresh = () => { setRefresh(refresh + 1) }
			React.useEffect(() => {
				const nitems = []
				if (activeFeed === "bookmarks") {
					// console.log(bookmarks.current);
					setFilteredItems(bookmarks.current)
				} else {
					for (let i = 0; i < items.length; i++) {
						const it = items[i];
						if (activeFeed === null) nitems.push(it)
						else if (it.sourceRss === activeFeed) nitems.push(it)
					}
					setFilteredItems(nitems)
				}
			}, [activeFeed, refresh, items])


			let finalItems = search !== "" ? searchItems : filteredItems


			// view toggle
			const [listView, setIntListView] = React.useState("list")
			const toggleListView = () => {
				let nView = listView === "list" ? "gallery" : "list"
				setIntListView(nView)
			}

			return (
				c('div', { className: "rss-app-wrapper" }, [

					c('div', { className: `filter-input-wrapper` }, [
					]),
					c('div', { className: `filter-list-wrapper` }, [
						c('select', {
							onChange: e => {
								let val = e.target.value
								if (val === "all") val = null
								setActiveFeed(val)
							}
						}, [
							c('option', { value: "all" }, [`-- all -- `]),
							c('option', { value: "bookmarks" }, [`-- bookmarks -- `]),
							feeds.map(feed =>
								c('option', { value: feed }, [`${feed}`])
							)
						]),
						c('div', {
							className: `filter-sort`,
							onClick: () => { loopSort() },
							title: sort === "date" ? `sorted by date` : `sorted randomly`
						}, [
							sort === "date" ? `⏱️️` : `🌀`
						]),
						c('div', {
							className: `filter-view`,
							onClick: () => { toggleListView() }
						}, [
							listView === "list" ? `🖼️` : `📰`
						]),
						c('input', {
							className: `filter-input`,
							onChange: e => {
								let val = e.target.value
								setSearch(val)
							}
						}),
					]),
					c('div', { className: `articles-list view-${listView} ${itemActive ? 'item-active-open' : ''}` }, [
						finalItems.map(item =>
							c('div', {
								className: `article-${listView}-item`,
								onClick: () => { setItemActive(item) }
							},
								[

									listView === "list" &&
									c('div', {
										className: "",
									}, [
										`[${isArticleBookmark(item) ? "⭑" : ""} ${item.sourceRss} ${item.smallDate}] ${item.title} `,
									]),

									listView !== "list" &&
									c('div', {
										className: "",
									},
										[
											c('div', { className: "title" }, [item.title]),
											c('div', { className: "meta" }, [`${isArticleBookmark(item) ? "⭑" : ""} ${item.sourceRss} - ${item.smallDate}`]),
											c('div', {
												className: "bg-item",
												style: {
													backgroundColor: item.bgColor,
													backgroundImage: "url(" + item.image + ")",
												}
											}),
											c('div', {}, []),
										])
								]),
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


















		ReactDOM.render(
			c(App),
			document.getElementById("root-react")
		);
	}

	api.utils.loadScripts(
		[
			"https://unpkg.com/react@18/umd/react.production.min.js",
			"https://unpkg.com/react-dom@18/umd/react-dom.production.min.js",
			"https://cdn.jsdelivr.net/npm/xml-js@1.6.9/dist/xml-js.min.js"
		],
		() => {
			execRssReader(innerTagStr)
			setTimeout(() => {
				api.utils.resizeIframe(opts.size);
				setTimeout(() => {
					api.utils.resizeIframe(opts.size);
					setTimeout(() => {
						api.utils.resizeIframe(opts.size);
					}, 100);
				}, 100);
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
		.article-details-bg {
				/* display:none; */
		}
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
				.article-details-bg {
						cursor: pointer;
						background: rgba(0,0,0,0.2);
						height: 100%;
						position: absolute;
						width: 100%;
						left: 0px;
						top: 0px;

				}
				.article-details-wrapper {
						width: calc(100% - 50px);
						left: 25px;
						box-shadow: 0px 0px 8px rgba(0,0,0,0.5);
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
				margin-bottom: 70px;
		}
		.article-description img {
				width:100%!important;
				height: auto!important;
		}
		.article-links-wrapper {
				font-size: 12px;
				padding-bottom: 14px;
				margin-bottom: 0px;
				display: flex;
		}
		.article-links-wrapper .article-link {
				cursor: pointer;
				text-decoration: underline;
				margin-right: 10px;
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
				background-position: center;
				background-repeat: no-repeat;
		}
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
		flex-direction: row;
		padding-bottom: 5px;
		padding-left: 55px;
		width: 50%
}
@media screen and (max-width: 500px) {
		.filter-list-wrapper {
				width: 100%;
		}
}
.filter-list-wrapper select {
		width: 70px;
}

.filter-view {
		margin-right: 3px;
		cursor: pointer;
}
/*
				LIST
*/
.articles-list {
		width: 100%;
		overflow-x: hidden;
		height: 100%;
		overflow-y: scroll;
}

/* list view  */
.articles-list.item-active-open {
		width: calc(50% - 30px);
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

/* gallery view  */
.articles-list.view-gallery {
		display: flex;
		flex-wrap: wrap;
}
.article-gallery-item {
		width: calc(50% - 20px);
		margin: 10px;
		border-radius: 10px;
		overflow: hidden;
		position: relative;
		cursor: pointer;

}

.article-gallery-item .meta  {
		position: absolute;
		bottom: 2px;
		color: #ffffff7d;
		font-size: 9px;
		margin-left: 11px;
}
.article-gallery-item .title  {
		margin: 0px 0px;
		position: absolute;
		padding: 10px;
		padding-top: 10px;
		padding-bottom: 10px;
		padding-top: 10px;
		word-break: break-word;
		width: 93%;
		bottom: 0px;
		font-size: 12px;
		font-weight: 800;
		color: #d7d6d6;
		background: linear-gradient(to top, #000, #0000);
		padding-top: 110px;
		padding-bottom: 17px;
		line-height: 14px;
}

.article-gallery-item .bg-item {
		width: 100%;
		min-height: 170px;
		background-size: cover;
		background-repeat: no-repeat;
		background-position: center;
}

.filter-input {
		width: 30%;
		margin-right: 10px;
		border: 0px;
		box-shadow: 0px 0px 2px 0px rgba(0,0,0,0.1);
		border-radius: 5px;
}
.audio-wrapper audio {
		width: 100%;
}
.video-wrapper iframe {
		width: 100%;
}
.filter-input {
		margin-left: 10px;
}
.filter-sort {
		cursor: pointer;
		padding-right: 10px;
		padding-left: 10px;
}

.video-wrapper  {
		width: calc(100% + 70px);
		position: relative;
		left: -33px;
}
.video-wrapper iframe {
		width: 100%;
		height: 250px;
}

`;

	return `
<div id='root-react'></div>
<style>
${styleRss}
</style>
`
}

window.initCustomTag = rssApp
