const rssApp = (innerTagStr, opts) => {

	if (!opts) opts = {}
	if (!opts.size) opts.size = "95%"
	if (!opts.rssToJsonUrl) opts.rssToJsonUrl = "https://api.rss2json.com/v1/api.json?rss_url="

	const h = `[CTAG RSS] v1.0.5 14/12/22`
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
		getBookmarks()









		//////////////////////////////////////////////////////////////////////////////////////////////////
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

						if (Array.isArray(data.items)) {
							const nitems = [...data.items]
							for (let j = 0; j < nitems.length; j++) {
								nitems[j].sourceRss = feedsArr[i].name
								const timestamp = Date.parse(nitems[j].pubDate)
								const d = new Date(timestamp)
								//const datestring = d.getDate()  + "-" + (d.getMonth()+1) + "-" + d.getFullYear() + " " + d.getHours() + ":" + d.getMinutes();
								const datestring = d.getDate() + "/" + (d.getMonth() + 1) + " " + d.getHours() + ":" + d.getMinutes();

								const bgColors = ["#264653", "#2A9D8F", "#E9C46A", "#F4A261", "#E76F51"]
								const cColor = bgColors[Math.floor(Math.random() * bgColors.length)];
								const bgImage = nitems[j].thumbnail || nitems[j].enclosure?.link

								nitems[j].bgColor = cColor
								nitems[j].image = bgImage

								nitems[j].timestamp = timestamp
								nitems[j].smallDate = datestring
								resItems.push(nitems[j])
							}
						}
						if (count === feedsArr.length) {
							// sort items by time
							resItems = resItems.sort((a, b) => b.timestamp - a.timestamp)
							setCache(resItems)
							cb(resItems)
						}

					});
			}
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
								p.article.pubDate + " - " + p.article.sourceRss
							]),
							type !== "audio" &&
							c('div', { className: "article-links-wrapper" }, [
								c('a', { className: "article-link", href: p.article.link, target: "_blank" }, ["link"]),
								c('a', {
									className: "article-link",
									onClick: () => { openLinkNewWindow(p.article.link) }
								}, ["open in window"]),
							]),
							type === "audio" &&
							c('div', { className: "audio-wrapper", }, [
								c('audio', { controls: "true" }, [
									c('source', {
										src: p.article.enclosure.link,
										type: p.article.enclosure.type
									})
								]),

								c('div', { className: "article-links-wrapper" }, [
									c('a', { className: "article-link", href: p.article.enclosure.link, target: "_blank" }, ["audio file"]),
									c('a', {
										className: "article-link",
										onClick: () => { openLinkNewWindow(p.article.enclosure.link) }
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









		///////////////////////////////////////////////////////////////////////////////////////
		// LIST VIEW
		//
		const App = () => {
			const titems = React.useRef([])
			const [items, setItems] = React.useState([])

			const [search, setSearch] = React.useState("")
			const [searchItems, setSearchItems] = React.useState([])

			const [filteredItems, setFilteredItems] = React.useState([])
			const [itemActive, setItemActive] = React.useState(null)
			const [feeds, setFeeds] = React.useState([])
			const [activeFeed, setActiveFeed] = React.useState("all")

			React.useEffect(() => {
				let nItems = []
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
			}, [activeFeed, refresh])


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
						c('input', {
							className: `filter-input`,
							onChange: e => {
								let val = e.target.value
								setSearch(val)
							}
						}),
						c('div', {
							className: `filter-view`,
							onClick: () => { toggleListView() }
						}, [
							listView === "list" ? `🖼️` : `📰`
						]),
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
			"https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"
		],
		() => {
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
				word-break: break-word;
				width: 96%;
				bottom: 0px;
				font-size: 13px;
				font-weight: 800;
				color: #d7d6d6;
				background: linear-gradient(to top, #000, #0000);
				padding-top: 60px;
				padding-bottom: 17px;
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

		`;

	return `
		<div id='root-react'></div>
		<style>
		${styleRss}
		</style>
		`
}

window.initCustomTag = rssApp
