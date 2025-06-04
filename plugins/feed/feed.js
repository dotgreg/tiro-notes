const helpText = `

<h3>Introduction</h3>
Feed CTAG allows you to view:<br>
- your RSS feeds and sort them by categories<br>
- your youtube subscriptions<br>
- to parse html websites (like duckduckgo search results) and display results in a feed-like manner<br><br>

Each line should be a feed, with the following format:<br>
- name | url | categories | limitFetchNb | advancedParams<br>

<h3>Simple RSS Reader example</h3>


<code>
<pre>
[[feed]]
    hn | https://news.ycombinator.com/rss |  _🕹️ geek
    R_AskHistorians | https://www.reddit.com/r/AskHistorians/.rss | _💬reddit

lemonde | https://www.lemonde.fr/rss/une.xml | _🗳️ polit
samfish shaarly | https://sammyfisherjr.net/Shaarli/?do=dailyrss |     _✨ quali,_🗳️ polit,_🕹️ geek
conversation | https://theconversation.com/articles.atom?language=en |     _✨ quali,_🗳️ polit,_⚛ science
brutalism flickr | https://www.flickr.com/services/feeds/groups_pool.gne?id=12792144@N00&lang=fr-fr&format=rss_200| _🖼️inspi 
    FP | https://foreignpolicy.com/feed/  | _🗳️ polit
    FT | https://www.ft.com/news-feed?format=rss  | _🗳️ polit
[[feed]]
</pre>
</code>

<h3>Scrapping HMTL websites and gather results:</h3>

for the different "path_", it should be javascript selectors on the page with the following logic:<br>
- path_block: the javascript path to the different items, it should be a list of items <br>
- path_title/link/content/etc.: the javascript path to the title of the item INSIDE path_both<br>
<br><br>
- waitInterval: the time to wait before scrapping the page, in seconds (default 0s) (10s seems a good value for duckduckgo results to not flag the scrapper as a bot)<br>
- idConfig: the id of the config, so you can use it in other feeds with the same config<br>

<code>
<pre>
[[feed]] 
ddg cyber 1 | https://html.duckduckgo.com/html/?q=kill%20switches%20cybersecurity&df=w | _🗳️ polit | 100 | idConfig="ddg" type="html" path_block=".result.results_links" path_title="h2.result__title" path_link=".result__a[href]"  path_text=".result__snippet" path_image=".result__icon img[src]" path_date=".result__extras__url span{2}" waitInterval="5" 
ddg cyber 2 | https://html.duckduckgo.com/html/?q=energy%20cybersecurity&df=w | _🗳️ polit | 100 | idConfig="ddg" 
ddg cyber 3 | https://html.duckduckgo.com/html/?q=cyber%20threat%20energydf=w | _🗳️ polit | 100 | idConfig="ddg" 
[[feed]] 
</pre>
</code>
`

const feedApp = (innerTagStr, opts) => {

		if (!opts) opts = {}
		if (!opts.size) opts.size = "95%"
		if (!opts.itemsPerFeed) opts.itemsPerFeed = 100
		if (!opts.feedType) opts.feedType = "xml"
		if (!opts.contentCacheHours && opts.contentCacheHours != 0) opts.contentCacheHours = 1 // cache content for an hour
		if (!opts.feedLoadDelay) opts.feedLoadDelay = 0 // cache content for an hour
		// if (!opts.preprocessItems) opts.preprocessItems = (url, items) => { return items }
		// if (!opts.fetchItems) opts.fetchItems = (url) => { return items }

		const h = `[CTAG FEED]`

		//@ts-ignore
		const api = window.api;
		const { div, updateContent } = api.utils.createDiv();
		const divId = `feed-${api.utils.uuid()}`;


		//
		// SUPPORT FUNCS
		//
		const each = (itera, cb) => {
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
		

		const debounce = (func, timeout = 300) => {
				let timer;
				return (...args) => {
						clearTimeout(timer);
						timer = setTimeout(() => { func.apply(this, args); }, timeout);
				};
		}

		//
		//  FETCH AND REDEABILITY
		//
		const fetchArticleContent = (url, cb) => {
				// api.call("ressource.fetch", [url, { disableCache: false, headers:[["Content-Type", "text/html; charset=utf-8"]] }], txt => {
				api.call("ressource.fetch", [url, { disableCache: false}], txt => {
						var doc = document.implementation.createHTMLDocument('');
						doc.open();
						doc.write(txt);
						doc.close();
						var article = new Readability(doc).parse();

						let textContent = article.textContent.replaceAll(`              `, `\n`)
						textContent = textContent.replaceAll(`          `, `\n`)
						textContent = textContent.replaceAll(`      `, `\n`)
						textContent = textContent.replaceAll(`    `, `\n`)
						textContent = textContent.replaceAll(`   `, `\n`)

						html = article.content

						cb({ title: article.title, text: textContent, html })
				})
		}


		console.log(h, "========= INIT with opts:", opts)


		// const feedsCategories = []
		// const failedFeeds = []

		let mainColor = "";
		const initFetchUserColor = (cb) => {
			api.call("userSettings.get", ['ui_layout_colors_main'], color => {
				mainColor = color.currentValue || color.defaultValue
				cb()
			});
		}

		const execFeedReader = (feedsStr) => {
			const commonLib = window._tiroPluginsCommon.commonLib
			const { notifLog, generateHelpButton, getOperatingSystem, onClick } = commonLib
				// const sortArr = (items,sortType) => {
				// 		if (sortType === "name") {
				// 				items.sort(function(a, b){
				// 						if(a.firstname < b.firstname) { return -1; }
				// 						if(a.firstname > b.firstname) { return 1; }
				// 						return 0;
				// 				})
				// 		}
				// 		return items
				// }
				const timestampToDate = (timestamp) => {
					let d = new Date(timestamp)
					let month = d.getMonth() + 1
					if (month < 10) month = "0" + month
					let year = d.getFullYear()
					let minutes = d.getMinutes()
					if (minutes < 10) minutes = "0" + minutes
					let datestring = d.getDate() + "/" + month + "/" + year + " " + d.getHours() + "h"; 
					// if today/yesterday, show it + time
					let today = new Date()
					let yesterday = new Date()
					yesterday.setDate(yesterday.getDate() - 1)
					let isToday = today.getDate() === d.getDate() && today.getMonth() === d.getMonth() && today.getFullYear() === d.getFullYear()
					if (isToday) datestring = "Today " + d.getHours() + "h" 
					// if up to 5 days ago, show it + time
					let daysAgos = Math.floor((today - d) / (1000 * 60 * 60 * 24))
					if (daysAgos === 1) datestring = "Yesterday " 
					else if (daysAgos > 1 && daysAgos < 7) datestring = daysAgos + " days ago " 
					// if up to 4 weeks
					let weeksAgo = Math.floor(daysAgos / 7)
					if (weeksAgo === 1) datestring = "1 week ago " 
					else if (weeksAgo > 1 && weeksAgo < 5) datestring = weeksAgo + " weeks ago " 
					// if up to 11 months
					let monthsAgo = Math.floor(daysAgos / 30)
					if (monthsAgo === 1) datestring = "1 month ago " 
					else if (monthsAgo > 1 && monthsAgo < 12) datestring = monthsAgo + " months ago " 
					// else only show "2 years ago"
					let yearsAgo = Math.floor(daysAgos / 365)
					if (yearsAgo === 1) datestring = "1 year ago " 
					else if (yearsAgo > 1) datestring = yearsAgo + " years ago " 
					return datestring
				}


			const analyzeFeedsConfigStr = (str) => {
				const feedsArr = str.split('\n')
				const feedsRes = []
				for (let i = 0; i < feedsArr.length; i++) {
					const feedParamsRaw = feedsArr[i].trim().split("|")
					//
					// PARAM 2 : categories
					//
					if (feedParamsRaw.length < 2) continue
					let categories = []
					if (feedParamsRaw[2]) categories = feedParamsRaw[2].split(",")
					for (let i = 0; i < categories.length; i++) {
						categories[i] = categories[i].trim()
					}
					//
					// PARAM 3 : custom fetch limit
					//
					let limitFetchNb = opts.itemsPerFeed
					if (feedParamsRaw[3]) limitFetchNb = parseInt(feedParamsRaw[3]) || opts.itemsPerFeed

					//
					// PARAM 4 : options like type="html" block=".result.results_links" title="h2.result__title" link=".result__a[href]"  text=".result__snippet" image=".result__icon img[src]" date=".result__extras__url span{2}"
					//
					let advancedParamsObj = {}
					if (feedParamsRaw[4] && feedParamsRaw[4].trim().length > 0) {
						// options looks like word="word word <something> {likethat}"
						let regex = /(\w+)=["']([^"']+)["']/g
						let rawStr = feedParamsRaw[4].trim()
						rawStr.replace(regex, (match, key, value) => {
							advancedParamsObj[key] = value
						})
					}


					//
					// PARAM 4 : title-based filter UNUSED 
					//
					// let filterFromTitle = null
					// if (feedParamsRaw[4]) {
					// 		filterFromTitle = feedParamsRaw[4]
					// }

					feedsRes.push({
						name: feedParamsRaw[0].trim(),
						url: feedParamsRaw[1].trim(),
						categories,
						limitFetchNb,
						advancedParams: advancedParamsObj,
						// filterFromTitle
					})
				}
				console.log(h, "1: gettings feedsRefs Arr", feedsRes)
				return feedsRes
			}

				





				//
				// CACHING MECHANISM
				//

				const getCachedJsons = (cb, setStatus, cache=true) => {
						// const hasUserReloaded = api.utils.getInfos().reloadCounter !== 0
						// nocache = hasUserReloaded
						if (cache) {
								// first get cached, if exists
								setStatus("Loading...")
								getContentCache(content => {
									// if cache, return content
									console.log(h, "=> getting CACHED feed json")
									cb(content)
								}, () => {
									console.log(h, "=> ERROR getting cached json, getting them directly")
									// if no cache OR expired, reload from json rss
									getJsons(cb, setStatus)
								})
						} else {
								// directly reload without cache
								setStatus("Loading... (refreshing from source)")
								getJsons(cb, setStatus)
						}
				}


				
				////////////////////////////////////////////////////////////////////////////////////
				// CACHING SETTINGS & CONTENT SYSTEM
				//
				const getCache = (id) => (onSuccess, onFailure) => {
					api.call("cache.get", [id], content => {
						if (content !== undefined && content !== null) onSuccess(content)
						else if (onFailure) onFailure()
					})
				}
				const setCache = (id, mins) => (content) => {
					if (!mins) mins = 6 * 60 
					api.call("cache.set", [id, content, mins]) 
				}
				
				const cacheContentId = `ctag-feed-${api.utils.getInfos().file.path}`
				const getContentCache = getCache(cacheContentId)
				const setContentCache = setCache(cacheContentId, opts.contentCacheHours*60)

				const cacheSettingsId = `ctag-settings-feed-${api.utils.getInfos().file.path}`
				const getSettingsCache = (name) => getCache(cacheSettingsId + name)
				const setSettingsCache = (name) => setCache(cacheSettingsId + name, -1)








				////////////////////////////////////////////////////////////////////////////////////
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









				//////////////////////////////////////////////////////////////////
				// FETCHING DATA
				//
				
				let configsCache = {}
				const getJsons = (cb, setStatus) => {
						console.log(h, `getting NEW uncached jsons`);
						const feedsArr = analyzeFeedsConfigStr(feedsStr)
						let resItems = []
						let count = 0
						// if we only have one feed with whole config and other feeds with idConfig param:
						for (let i = 0; i < feedsArr.length; i++) {
							let feed = feedsArr[i]
							if (feed.advancedParams.idConfig && feed.advancedParams.type) configsCache[feed.advancedParams.idConfig] = { ...feed.advancedParams }
							if (!feed.advancedParams.type && feed.advancedParams.idConfig && configsCache[feed.advancedParams.idConfig]) feedsArr[i].advancedParams = { ...configsCache[feed.advancedParams.idConfig] }
						}
						console.log(h, `feedsArr after config cache:`, feedsArr, configsCache)
						
						for (let i = 0; i < feedsArr.length; i++) {
							setTimeout(() => {
								fetchFeedItems(feedsArr, i, items => {
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
													nitems[j].sourceFeed = feedsArr[i].name
													// CATEGORIES
													nitems[j].categories = feedsArr[i].categories
													// TITLE
													nitems[j].title = g(nitems[j].title)
													// DESCRIPTION
													nitems[j].description = g(nitems[j].description) || g(nitems[j].summary)
													// CONTENT
													nitems[j].content = g(nitems[j].content) || ""
													// CONTENT adding H1 in case there is none for header counter css to work
													// nitems[j].content = `<h1>${nitems[j].title}</h1>${nitems[j].content }` 

													// LINK
													nitems[j].link = g(nitems[j].link) || g(nitems[j].enclosure?.link) || ""
													// in case of reddit, look for link inside the content
													if (nitems[j].link === "") {
															let contentAndDescription = nitems[j].description + nitems[j].content
															let reddit = contentAndDescription.match(/\"(https\:\/\/www\.reddit\.com\/r\/[^\&]*)\"/gmi)
															if (reddit && reddit[1]) nitems[j].link =  reddit[1].replaceAll("\"","")
															else {
																let linkInContent = contentAndDescription.match(/href=['"]([^'">]+)['"]/i)
																if (linkInContent && linkInContent[1]) nitems[j].link =  linkInContent[1]
															}
													}


													// TIME
													if (nitems[j]["updated"]) nitems[j].pubDate = g(nitems[j]["updated"])
													if (nitems[j]["dc:date"]) nitems[j].pubDate = nitems[j]["dc:date"]
													if (nitems[j]["published"] && nitems[j]["published"]["_text"]) nitems[j].pubDate = nitems[j]["published"]["_text"]

													const timestamp = Date.parse(g(nitems[j].pubDate))
													const d = new Date(timestamp)

													nitems[j].timestamp = timestamp

													// COLOR
													const bgColors = ["#264653", "#2A9D8F", "#E9C46A", "#F4A261", "#E76F51"]
													const cColor = bgColors[Math.floor(Math.random() * bgColors.length)];
													nitems[j].bgColor = cColor
													// IMAGE
													let bgImage = 
																g(nitems[j].image) ||
																g(nitems[j].enclosure?._attributes?.url) ||
																g(nitems[j].enclosure?.link) ||
																g(nitems[j]["media:content"]?._attributes?.url) ||
																g(nitems[j].thumbnail) ||
																g(nitems[j]["itunes:image"]?._attributes?.href)||
																g(nitems[j]["media:thumbnail"]?._attributes?.url) 

													if (bgImage && (bgImage.endsWith("mp3") || bgImage.endsWith("xml"))) bgImage = null
													// if (nitems[j].sourceFeed.includes("rdv")) console.log(nitems[j])
													if (!bgImage) {
														let contentAndDescription = nitems[j].description + nitems[j].content
														// look for first image in content
														let imageInContent = contentAndDescription.match(/<img[^>]+src=['"]([^'">]+)['"]/i)
														if (imageInContent && imageInContent[1]) bgImage =  imageInContent[1]
													}
													if (nitems[j].enclosure) {
													}
													
													nitems[j].image = bgImage
													// In case of Flickr, image given is often compressed in content, so add bgImage in content
													if (bgImage && bgImage.includes("staticflickr.com") && bgImage.endsWith(".jpg")) {
														// let nbgImage = bgImage.replace(/_[a-z]\.jpg/g, "_b.jpg")
														// nitems[j].image = nbgImage
														nitems[j].content = `<img src="${bgImage}" ><br>` + nitems[j].content
													}

													// ENCLOSURE
													if (!nitems[j].enclosure) nitems[j].enclosure = {}
													else if (nitems[j].enclosure?._attributes) nitems[j].enclosure = { ...nitems[j].enclosure._attributes }


													// for all fields, check if <a href exist, if it does, add target="_blank" in between
													for (const key in nitems[j]) {
														let nval = nitems[j][key]
														if (typeof nval === "string") {
															nitems[j][key] = nval.replaceAll("<a ", "<a target='_blank' ")
														}
													}

													resItems.push(nitems[j])
											}
											feedItems = nitems
									}
									let debugInfo = `${count}/${feedsArr.length} : ${feedsArr[i].name} => ${feedItems.length} els`
									console.log(h, `feed loaded ${debugInfo}`);
									setStatus(`Loading... (loading feeds : ${debugInfo})`)
									// sort items by time
									resItems = resItems.sort((a, b) => b.timestamp - a.timestamp)
									setDebounceCache(resItems)
									cb(resItems)
									if (feedItems.length === 0) {
										api.call("ui.notification.emit", [{content:"Failed fetching feed: "+feedsArr[i].name, options: {hideAfter: 3 }}])
									}
								}, (error) => {
									// on failure
									// setFailedFeeds([...failedFeeds, feedsArr[i].name])
									api.call("ui.notification.emit", [{content:"Failed fetching feed: "+feedsArr[i].name, options: {hideAfter: 3 }}])
									console.log(h, `feed FAILED ${JSON.stringify(feedsArr[i])} =>`, {error});
								})
							}, opts.feedLoadDelay * i)
						}
				}

				
				
				const setDebounceCache =  debounce((resItems) => {
						setContentCache(resItems)
				}, 2000)

				const enrichItems = (items, feed) => {
						each(items, it => {
								it.feed = feed
						})
								return items
				}

				//
				// custom fetcher possible (for youtube for instance)
				// enrich items data with feed data
				//
				let countWaitIntervalId = 0
				const fetchFeedItems = (feeds, i, cb, onFailure) => {
					let feed = feeds[i]
						const wrappedCb = items => {
							let enrichedItems = enrichItems(items, feed)
							cb(enrichedItems)
						}

						if (opts.fetchItems) {
								console.log(h, "CUSTOM FETCH FN detected");
								opts.fetchItems(feed, wrappedCb, onFailure)	
						}
						else if (feed.advancedParams?.type === "html") {
							let waitInterval = 0
							countWaitIntervalId = countWaitIntervalId + 1
							if (feed.advancedParams?.waitInterval) waitInterval = parseInt(feed.advancedParams?.waitInterval) || 0
							setTimeout(() => {
								console.log(h, "HTML SCRAP FN detected", {feed, i, waitInterval});
								getScrappedHtmlFeed(feeds, i, wrappedCb, onFailure)
							}, countWaitIntervalId*waitInterval*1000)
						}
						else getXml(feed, wrappedCb, onFailure)

				}



				///////////////////////////////////////////////////////////////////////////////////
				// PARSERS
				//
				// 
				const getScrappedHtmlFeed = (feeds,i , cb, onFailure) => {
					let feed = {...feeds[i]}
					let uas = commonLib.commonUserAgents()
					let ua = uas[Math.floor(Math.random() * uas.length)]

					let headers = [
						// ["Accept", "*/*"],
						["User-Agent", ua],
						['Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'],
						['Accept-Language', 'en-US,en;q=0.5'],
						['Connection', 'keep-alive'],
						['Upgrade-Insecure-Requests', '1'],
						['Cache-Control', 'max-age=0']
					]

					// we should get inside feed.advancedParams : path_block, path_title, path_link, path_date, path_content
					// type="html" block=".result.results_links" title="h2.result__title" link=".result__a[href]"  text=".result__snippet" image=".result__icon img[src]" date=".result__extras__url span{2}"
					// else throw popup 

					let shouldStop = true
					if (feed.advancedParams?.path_block && feed.advancedParams?.path_title && feed.advancedParams?.path_link && feed.advancedParams?.path_date && feed.advancedParams?.path_text) { shouldStop = false }
					if (shouldStop) {
						notifLog("Please provide the following parameters in your feed config: path_block, path_title, path_link, path_date, path_content. This is required for the HTML scrapper to work. \n\n" + JSON.stringify(feed), "feed_html_scrap_error", 10)
						return
					}
					let pathBlock = feed.advancedParams.path_block
					let pathTitle = feed.advancedParams.path_title
					let pathLink = feed.advancedParams.path_link
					let pathDate = feed.advancedParams.path_date
					let pathText = feed.advancedParams.path_text 
					let pathImage = feed.advancedParams.path_image || null

					
					api.call("ressource.fetch", [feed.url, { disableCache: true, noCacheArg: true, headers }], htmlTxt => {
						console.log("HTML SCRAP!!!", { feed , htmlTxt})
						// create a DOM parser 
						let parser = new DOMParser();
						// parse the HTML string into a document
						let ndocument = parser.parseFromString(htmlTxt, 'text/html');
						// let ndocument = parser.parseFromString(testPageHtml, 'text/html');
						// get all path_Block queryall js
						let resultFeed = []
						let blocks = ndocument.querySelectorAll(pathBlock)
						let process_query_selector = (el, queryStr) => {
							if (!el.querySelector) return
							// if we have {[1-9]*}, remove it and add value to childNumber 
							let childNumber = -1
							if (queryStr.includes("{")) {
								let parts = queryStr.split("{")
								queryStr = parts[0].trim()
								childNumber = parseInt(parts[1].replace("}", "").trim()) - 1 // convert to 0 based index
							}
							// if we have [src/other attr] add value to attributeToSelect
							let attributeToSelect = "innerText"
							if (queryStr.includes("[")) {
								let parts = queryStr.split("[")
								queryStr = parts[0].trim()
								attributeToSelect = parts[1].replace("]", "").trim()
							}
							let res = null
							try {
								if (childNumber === -1) res = el.querySelector(queryStr)[attributeToSelect].trim()
								else res = el.querySelectorAll(queryStr)[childNumber][attributeToSelect].trim()
								// console.log("process_query_selector", { el, queryStr, childNumber, attributeToSelect, res })
								 return res
								
							} catch (error) {
								notifLog("Error parsing block: " + error.message, "feed_html_scrap_error", 10)
								
							}
						}
						each(blocks, block => {
								
								// let title = block.querySelector(pathTitle).innerText.trim()
								// let link = block.querySelector(pathLink).href.trim()
								// let date = block.querySelector(pathDate).innerText.trim()
								// let text = block.querySelector(pathText).innerText.trim()
								// let image = block .querySelector(pathImage) ? block.querySelector(pathImage).src.trim() : null
								
								if (block.querySelector){
									let dateRaw = process_query_selector(block, pathDate)
									if (!dateRaw || dateRaw === "") dateRaw = new Date().toISOString() // fallback to current date if not found
									// let ndate = new Date(process_query_selector(block, pathDate))
									// let timestamp = ndate.getTime() || new Date().getTime()
									// timestamp = Math.round(timestamp)
									// console.log(33333, ndate, timestamp, block)

									resultFeed.push({
										title: process_query_selector(block, pathTitle),
										link: process_query_selector(block, pathLink),
										pubDate: {_text:dateRaw},
										content: process_query_selector(block, pathText),
										image: pathImage ? process_query_selector(block, pathImage) : null,
										sourceFeed: feed.name,
										categories: feed.categories || [],
										enclosure: { type: "text/html" } // default type
									})
								}

						})
						
						cb(resultFeed)
					})

				}

				const getXml = (feed, cb, onFailure) => {
						api.call("ressource.fetch", [feed.url, { disableCache: true, noCacheArg:true, headers:[["Accept","*/*"]] }], txt => {
							
							
							try {
								let res2 = xml2js(txt, { compact: true })
								let items = res2.feed?.entry // XML1
								if (!items) items = res2.rss?.channel.item // XML2
								if (!items) items = []
								items = items.slice(0, feed.limitFetchNb)
								cb(items)
							} catch (error) {
								
								console.error(h, "ERROR parsing xml", {xmlRes: txt});
								if (onFailure) onFailure(error)
							}
						})
				}












				///////////////////////////////////////////////////////////////////////////////////
				// ARTICLE VIEW
				//
				const c = React.createElement;
				const ArticleDetail = (p) => {

						//
						// Article loading + TTS
						//
						const [fetchStatus, setFetchStatus] = React.useState("")
						const [articleContent, setArticleContent] = React.useState(null)

						const fetchArticle = (cb) => {
								setFetchStatus("loading...")
								fetchArticleContent(p.article.link, obj => {
										setFetchStatus(null)
										setArticleContent(obj)
										if (cb) cb(obj)
								})
						}
						const openTTS = () => {
								let opts = { id: p.article.link }
								if (!articleContent) {
										fetchArticle(obj => {
												// setTimeout(() => {
												api.call("ui.textToSpeechPopup.open", [obj.text, opts], () => { })
												// }, 1000)
										})
								} else {
										api.call("ui.textToSpeechPopup.open", [articleContent.text, opts], () => { })
								}
						}


						//
						// TYPES AUDIO/VIDEO
						//
						const [type, setType] = React.useState("text")
						React.useEffect(() => {
								setArticleContent(null)

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


						const openLinkNewWindow = (url) => {
								window.open(url, 'feed_window', 'location=yes,height=670,width=820,scrollbars=yes,status=no');
						}

						// bookmarks
						const [refresh, setRefresh] = React.useState(0)
						const doRefresh = () => {
								setRefresh(refresh + 1)
								p.onBookmarkToggle()
						}
						let isBookmark = isArticleBookmark(p.article)


						let finalArticleContent = p.article.description
						if (p.article.content !== p.article.description) finalArticleContent = p.article.content + p.article.description
						// if (articleContent) finalArticleContent = articleContent

						return (
								c('div', { className: "article-details-prewrapper" }, [
										c('div', { className: "article-details-bg", onClick: e => { p.onClose(); } }, []),
										c('div', { className: "article-details-wrapper" }, [
												c('div', { className: "article-close", onClick: () => { p.onClose() } }, ["x"]),
												c('div', {
														className: `article-bookmark-toggle ${isBookmark ? "fav" : "not-fav"}`,
														onClick: () => {
																if (isBookmark) {
																		removeBookmark(p.article, doRefresh)
																}
																else {
																		addBookmark(p.article, doRefresh)
																}
														}
												},
													`${!isBookmark ? "★" : "★"}`),
												c('div', { className: "article-title" }, [`${isBookmark ? "★ " : ""}${p.article.title}`]),
												c('div', {
														className: "bg-image",
														style: {
																backgroundImage: "url(" + p.article.image + ")",
																backgroundColor: p.article.bgColor
														}
												}),
												c('div', { className: "article-content-wrapper" }, [
														c('div', { className: "article-time" }, [
															timestampToDate(p.article.timestamp) + " ",
															c('span', { className: "article-filter-links" }, [
																c('span', {  onClick: () => { p.onFeedClick(p.article.sourceFeed) } }, 
																[p.article.sourceFeed + ""]
																)
															]),
															// show links to categories
															c('span', { className: "article-filter-links" }, [
																	p.article.categories.map(cat => 
																		c('span', {  onClick: () => { p.onCategoryClick(cat) } }, [ cat + "" ])
																	)
															]),
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
																		c('a', {
																				className: "article-link",
																				onClick: () => { fetchArticle() }
																		}, ["load Article"]),
																		c('a', {
																				className: "article-link",
																				onClick: () => { openTTS() }
																		}, ["🎵"]),
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
																				c('a', {
																						className: "article-link",
																						onClick: () => {
																							let invidiousLink = `https://redirect.invidious.io/watch?v=${p.article.enclosure.videoId}`
																							openLinkNewWindow(invidiousLink)
																						}
																				}, ["open individuous link"]),
																				c('a', {
																						className: "article-link",
																						href: `https://youtube.com/watch?v=${p.article.enclosure.videoId}`,
																						target: "_blank"
																				}, ["link"]),
																				c('a', {
																						className: "article-link",
																						href: `https://redirect.invidious.io/watch?v=${p.article.enclosure.videoId}`,
																						target: "_blank"
																				}, ["Individious link"]),
																		]),
																]),
														// show link to sourcefeed
														c('div', {
																className: "article-status-fetch",
														}, [fetchStatus]),
														articleContent && c('div', {
																className: "article-full-content",
																dangerouslySetInnerHTML: { __html: articleContent.html.trim() }
														}),
														c('div', {
																className: "article-description",
																dangerouslySetInnerHTML: { __html: finalArticleContent.trim() }
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

				const useDebounce = (value, delay) => {
						const [debouncedValue, setDebouncedValue] = React.useState(value)
						React.useEffect(() => {
								const timer = setTimeout(() => setDebouncedValue(value), delay || 500)
								return () => {
										clearTimeout(timer)
								}
						}, [value, delay])
						return debouncedValue
				}

				const App = () => {

						const titems = React.useRef([])
						const [items, setItems] = React.useState([])

						const [search, setSearch] = React.useState("")
						const [searchItems, setSearchItems] = React.useState([])


						const [filteredItems, setFilteredItems] = React.useState([])
						const [itemActive, setItemActive] = React.useState(null)
						const [feeds, setFeeds] = React.useState([])
						const [activeFeed, setActiveFeedInt] = React.useState(null)
						const activeFeedRef = React.useRef(null)
						const setActiveFeed = (nval) => {
							activeFeedRef.current = nval
							setActiveFeedInt(activeFeedRef.current)
						} 

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
								if (filteredItems.length === 0) return
								for (let i = 0; i < filteredItems.length; i++) {
										let a = filteredItems[i]
										let searchee = a.title?.toLowerCase() + a.content?.toLowerCase() + a.sourceFeed?.toLowerCase()
										if (searchee.includes(search.toLowerCase())) {
												nItems.push(a)
										}
								}
								setSearchItems(nItems)
						}, [search, filteredItems])

						//
						// refresh feeds cache
						//
						const [forceFeedRefresh, setForceFeedRefresh] = React.useState(0)
						const refreshFeeds = () => {
							setForceFeedRefresh(forceFeedRefresh + 1)
						}


						const [status, setStatus] = React.useState("")
						const [categories, setCategories] = React.useState([])
						const [feedsCats, setFeedsCats] = React.useState({})
						const [activeCat, setActiveCat] = React.useState(null)

						// const [failedFeeds, setFailedFeedsInt] = React.useState([])
						// const setFailedFeeds = (nval) => {
						// 	console.log(123123, nval)
						// 	setFailedFeedsInt(nval)
						// }
						// React.useEffect(() => {
						// 	console.log(failedFeeds)
						// }, [failedFeeds])

						// INITIAL LOADING
						React.useEffect(() => {
								let cache = forceFeedRefresh === 0
								if (opts.contentCacheHours === 0) cache = false
								setStatus("Loading... (loading bookmarks)")
								getBookmarks(() => {
										setStatus("Loading... (loading feeds)")
										getCachedJsons(nitems => {
												let ncats = []
												// const i = [...nitems]
												titems.current = nitems
												const nfeeds = []
												const nitemsNotHidden = []
												let nFeedsCats = feedsCats
												for (let i = 0; i < nitems.length; i++) {
														const it = nitems[i];
														if (!nfeeds.includes(it.sourceFeed)) nfeeds.push(it.sourceFeed)
														// gather all cats together
														let nFeedCats = nFeedsCats[it.sourceFeed] || []
														each(it.categories, ct => {
															let ncat = ct.trim()
															if (ncats.indexOf(ncat) === -1) ncats.push(ncat)
															if (!nFeedCats.includes(ncat)) nFeedCats.push(ncat)
														})
														nFeedsCats[it.sourceFeed] = nFeedCats
														// if it.hidden, do not output it
														if (it.hidden !== true) {
																nitemsNotHidden.push(it)
														}
												}
												// sorting everything
												ncats.sort()
												nfeeds.sort()
												setFeedsCats(nFeedsCats)
												setCategories(ncats)
												setFeeds(nfeeds)
												setStatus("")
												setItems(nitemsNotHidden)

												// if no active feed selected, show everything by default
												if(!activeFeedRef.current) {
													setActiveFeed(null)
												}
												
										}, setStatus, cache)
								})
						}, [forceFeedRefresh])

						const [refresh, setRefresh] = React.useState(0)
						const doRefresh = () => { setRefresh(refresh + 1) }

						React.useEffect(() => {
								const nitems = []
								if (activeFeed === "bookmarks") {
									for (let i = 0; i < bookmarks.current.length; i++) {
											let b = bookmarks.current[i]
											if (b.sourceRss) b.sourceFeed = b.sourceRss
									}
									setFilteredItems(bookmarks.current)
								} else if (activeFeed !== null) {
										for (let i = 0; i < items.length; i++) {
												const it = items[i];
												if (activeFeed === null) nitems.push(it)
												else if (it.sourceFeed === activeFeed) nitems.push(it)
										}
										setFilteredItems(nitems)
								} else if (activeCat !== null) {
										each(items, it => {
												if (activeCat === null) nitems.push(it)
												else if (it.categories.indexOf(activeCat) !== -1) nitems.push(it)
										})
												setFilteredItems(nitems)
								} else {
										setFilteredItems(items)
								}
						}, [activeCat, activeFeed, refresh, items])


						let finalItems = search !== "" ? searchItems : filteredItems

						// view toggle
						const [listView, setIntListView] = React.useState("list")
						const toggleListView = () => {
								// let nView = listView === "list" ? "gallery" : "list"
								// toggle between gallery, list and full-width
								let nView = "list"
								if (listView === "list") nView = "gallery"
								if (listView === "gallery") nView = "full-width"
								if (listView === "full-width") nView = "list"

								setIntListView(nView)
								setSettingsCache("listView")(nView)
						}
						React.useEffect(() => {
								getSettingsCache("listView")(v => { 
									setIntListView(v)
								})
						}, [])
						


						let itemOpenClass = itemActive ? "item-active" : ""


						//
						// INFINITE SCROLL LOGIC
						//
						let infiniteScrollItems = [...finalItems]
						let stepInfScroll = 30
						const [infScrollNbEls, setInfScrollNbEls] = React.useState(stepInfScroll)
						if (infiniteScrollItems.length > infScrollNbEls) infiniteScrollItems = finalItems.slice(0, infScrollNbEls)

						const onScroll = () => {
								infiniteScrollLogic()
						}

						const debounceUpdateInfScroll = useDebounce(() => {
								let nVal = infScrollNbEls+stepInfScroll
								// console.log("debounceUpdateInfScroll to", nVal)
								//setInfScrollNbEls(nVal)
						}, 500)


						const infiniteScrollLogic = () => {
								let wrapper = document.getElementById("infinite-scroll-wrapper")
								let inner = document.getElementById("infinite-scroll-inner")
								if (wrapper && inner) {
										let wh = wrapper.offsetHeight
										let ih = inner.offsetHeight
										let s = wrapper.scrollTop
										let diff = -(wh-ih) - s
										if (diff < 10) {
												let nVal = infScrollNbEls+stepInfScroll
												// console.log("debounceUpdateInfScroll to", nVal)
												setInfScrollNbEls(nVal)
										}
								} 
						}

						//
						// filter bar system
						//
						const [showBar, setShowBar] = React.useState(false)
						const toggleBar = () => {
								let nView = !showBar
								setShowBar(nView)
								setSettingsCache("showBarView")(nView)
						}
						React.useEffect(() => {
								getSettingsCache("showBarView")(v => { 
									setShowBar(v)
								})
						}, [])

						
						


						const [filterBarList, setFilterBarList] = React.useState([])
						React.useEffect(() => {
							const isActive = (type, val, activeVal, activeVal2) => {
								let res = ""
								if (type === "cat" && val === activeVal) res = "active" 
								if (type === "feed" && val === activeVal) res = "active" 
								if (type === "all" && activeVal === null && activeVal2 === null) res = "active" 
								return res
							}
							const nfilterBarList = []
							nfilterBarList.push({label: "all", value: "all", active:isActive("all", "", activeCat, activeFeed)})
							nfilterBarList.push({label: "⭐ bookmarks", value: "bookmarks", active:isActive("cat", "bookmarks", activeFeed)})
							nfilterBarList.push({label: "☰ categories  ", value: "bookmarks"})
							categories.map(cat =>
								nfilterBarList.push({label: cat, value: `cat-${cat}`, active:isActive("cat", cat, activeCat)})
							),
							nfilterBarList.push({label: "☰ feeds  "})
							let filterFeeds = []
							// if activeCategory, show only feeds from this category
							if (activeCat !== null) {
								each(feedsCats, (feedCats, feedName) => {
									if (feedCats.indexOf(activeCat) === -1) return
									filterFeeds.push({label: feedName, value: `feed-${feedName}`, active:isActive("feed", feedName, activeFeed)})
								})
							}
							// if activeFeed, only show that feed
							// else if (activeFeed !== null && activeFeed !== "bookmarks") {
							// 	filterFeeds.push({label: activeFeed, value: `feed-${activeFeed}`, active:isActive("feed", activeFeed, activeFeed)})
							// } 
							else {
								feeds.map(feed =>
									filterFeeds.push({label: feed, value: `feed-${feed}`, active:isActive("feed", feed, activeFeed)})
								)

							}
							// sort by label name first letter
							filterFeeds = filterFeeds.sort((a, b) => a.label.localeCompare(b.label))

							nfilterBarList.push(...filterFeeds)
							// finally push failed feeds
							// if (failedFeeds.length > 0) {
							// 	nfilterBarList.push({label: "-- failed feeds -- "})
							// 	failedFeeds.map(feed =>
							// 		nfilterBarList.push({label: `x ${feed}`, value: `failed-feed-${feed}`, active:isActive("feed", feed, activeFeed)})
							// 	)
							// }
							setFilterBarList(nfilterBarList)
						}, [categories, feeds, activeFeed, activeCat])

						//
						// ON SELECT CHANGE
						//
						const onFilterChange = (filterId) => {
							
								if (filterId === "all") {
										setActiveFeed(null)
										setActiveCat(null)
								} else if (filterId.startsWith("feed-")) {
										let v = filterId.replace("feed-", "")
										setActiveFeed(v)
										setActiveCat(null)
								}
								else if (filterId.startsWith("cat-")) {
										let v = filterId.replace("cat-", "")
										setActiveFeed(null)
										setActiveCat(v)
								} else if (filterId === "bookmarks") {
										setActiveFeed(filterId)
								}
						}
						

						return (
								c('div', { className: "feed-app-wrapper" }, [
									
									

									//
									// TOP FILTER BAR
									//

									c('div', { className: `top-wrapper` }, [
										c('div', { className: `filters-top-wrapper` }, [

												// FEEDS
												// c('select', {
												// 		onChange: e => {
												// 			let filterId = e.target.value
												// 			onFilterChange(filterId)
												// 		}
												// }, [
												// 		c('option', { value: "all" }, [`-- all`]),
												// 		c('option', { value: "bookmarks" }, [`-- bookmarks`]),
												// 		c('option', { value: "all" }, [`-- categories -- `]),
												// 		categories.map(cat =>
												// 				c('option', { value: `cat-${cat}` }, [`${cat}`])
												// 		),
												// 		c('option', { value: "all" }, [`-- feeds -- `]),
												// 		feeds.map(feed =>
												// 				c('option', { value: `feed-${feed}` }, [`${feed}`])
												// 		)
												// ]),
												c('div', {
													className: `filter-refresh filter-toggle`,
													onClick: () => { refreshFeeds() },
													title: `Refresh`
												}, [
													c('div', {className: `fa fa-refresh`})
												]),
												c('div', {
													className: `filter-bar-appear filter-toggle`,
													onClick: () => { toggleBar() },
													title: !showBar ? `show bar` : `hide bar`
												}, [
													!showBar ? c('div', {className: `fa fa-bars`}): c('div', {className: `fa fa-expand`})
												]),
												c('div', {
														className: `filter-sort filter-toggle`,
														onClick: () => { loopSort() },
														title: sort === "date" ? `sorted by date` : `sorted randomly`
												}, [
														sort === "date" ? c('div', {className: `fa fa-random`}): c('div', {className: `fa fa-clock`})
												]),
												c('div', {
														className: `filter-view filter-toggle`,
														onClick: () => { toggleListView() }
												}, [
														listView === "list" && c('div', {className: `fa fa-border-all`}) ,
														listView === "gallery" && c('div', {className: `fa fa-image`}) ,
														listView === "full-width" && c('div', {className: `fa fa-list`}),
												]),
												c('div', {
														className: `help-button filter-toggle`,
														dangerouslySetInnerHTML: { __html: commonLib.generateHelpButton(helpText, "Feed Ctag Help") },
												} ),

												c('input', {
														className: `filter-input`,
														onChange: e => {
																let val = e.target.value
																setSearch(val)
														}
												}),
												
										]),
									]),


										status !== "" && c('div', {class: "status"}, [
												status,
										]),
									
									c('div', { className: `left-right-wrapper` }, [
										//
										// LEFT BAR FILTER
										//
										c('div', { className: `left-wrapper ${showBar ? "show" : "hidden"}` }, [
											c('div', { className: `hide-scrollbar` }, [
												c('div', { className: `filter-bar-left` }, [
													filterBarList.map(filter =>
															c('div', { 
																className:`filter filter-${filter.value} ${filter.active}`, 
																value: filter.value,
																onClick: () => {
																	let filterId = filter.value
																	onFilterChange(filterId)
																}
															}, [`${filter.label}`])
													),
												]),
											]),
										]),
										//
										// RIGHT PANEL
										//
										c('div', { className: "right-wrapper"}, [
											c('div', { className: "hide-scrollbar-right"}, [
												c('div', { 
														onScroll,
														id:"infinite-scroll-wrapper",
														className: `articles-list ${itemOpenClass} view-${listView} ${itemActive ? 'item-active-open' : ''}` 
												}, 
													[
														c('div', {id:"infinite-scroll-inner",},[
															// V1
															infiniteScrollItems.map(item =>
																c('div', {
																	className: `article-${listView}-item`,
																	onClick: () => { setItemActive(item) }
																},
																	[

																		listView === "list" &&
																			c('div', {
																					className: "",
																			}, [
																					`[${isArticleBookmark(item) ? "⭑" : ""} ${item.sourceFeed} ${timestampToDate(item.timestamp)}] ${item.title} `,
																			]),
																		listView !== "list" &&
																			c('div', {
																					className: `view-${listView}-item-inner`,
																			},
																			[
																				c('div', {
																						className: "bg-item",
																						style: {
																								backgroundColor: item.bgColor,
																								backgroundImage: "url(" + item.image + ")",
																						}
																				}),
																				c('div', { className: "title-wrapper" }, [
																						c('div', { className: "title" }, [item.title]),
																						c('div', { className: "meta" }, [`${isArticleBookmark(item) ? "⭑" : ""} ${item.sourceFeed} - ${timestampToDate(item.timestamp)}`]),
																				])
																			]),
																	]
																),
															)
														])
													]
												),

											itemActive && c(ArticleDetail, {
													article: itemActive,
													onClose: () => {
															setItemActive(null)
													},
													onFeedClick: (feedName) => {
														setActiveFeed(feedName)
														setActiveCat(null)
														setItemActive(null)


													},
													onCategoryClick: (catName) => {
														setActiveCat(catName)
														setActiveFeed(null)
														setItemActive(null)
													},
													onBookmarkToggle: () => {
															doRefresh()
													}
											}, []),
										]) // end right panel
									]) // end hide scroll wrapper
								]) // end left-right panel
							])
						);
				}











				setTimeout(() => {
						ReactDOM.render(
								c(App),
								document.getElementById("root-react")
						);
				}, 500)
		}

		// XML feeds
		let toLoad = ["https://cdn.jsdelivr.net/npm/xml-js@1.6.9/dist/xml-js.min.js"]

		// YOUTUBE feeds
		if (opts.feedType === "youtube") {
				toLoad = [opts.base_url + "/youtube-feed.js"]
		}
		api.utils.loadScripts(
				[
						// "https://unpkg.com/react@18/umd/react.production.min.js",
						// "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js",
						"https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js",
						"https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js",
						"https://cdn.jsdelivr.net/npm/moz-readability@0.2.1/Readability.js",
						`${opts.plugins_root_url}/_common/common.lib.js`,
						...toLoad,
						// "https://cdn.jsdelivr.net/npm/react-window@1.8.8/dist/index-prod.umd.min.js"
						// "https://cdn.jsdelivr.net/npm/react-window@1.8.8/dist/index-prod.umd.js"
				],
				() => {
						if (opts.feedType === "youtube") {
								opts.fetchItems = window.fetchYoutubeItems
								window.youtubeKey = opts.youtubeKey
								window.youtubeTimeFilter = opts.youtubeTimeFilter
								console.log("YOUTUBE MODE", { opts });
						}

						initFetchUserColor(() => {
							execFeedReader(innerTagStr)

							// insert style
							const style = document.createElement('style');
							style.innerHTML = styleFeed(mainColor);
							document.head.appendChild(style);

							setTimeout(() => {
									api.utils.resizeIframe(opts.size);
									setTimeout(() => {
											api.utils.resizeIframe(opts.size);
											setTimeout(() => {
													api.utils.resizeIframe(opts.size);
											}, 100);
									}, 100);
							}, 100);
						});
				}
		);




		const styleFeed = (mainColor) => `
		h1:before, h2:before, h3:before, h4:before, h5:before, h6:before {
			display: none;
		}

		html, body,
		#root-react {
				height: 100vh;
				overflow: hidden;
		}
		.status {
			text-align:center;
			padding: 40px;
		}
		body {
				font-family: sans-serif;
				padding: 0px;
				margin: 0px;
		}
		.feed-app-wrapper {
				position: relative;
				height: 100%;
		}
		/* DETAILS  */
		.article-details-bg {
				/* display:none; */
		}
		.article-details-wrapper {
			width: calc(50% - 35px);
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

		
		@media screen and (max-width: 700px) {
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
				white-space: pre-line;
		}
		.article-full-content img {
				max-width: 100%


		}
		.article-full-content {
				background: #f4f4f4;
				padding: 10px;
				border-radius: 8px;
				position: relative;
				left: -20px;
				width: calc(100% + 20px);
				margin-bottom: 20px;
		}
		.article-description img {
				width:calc(100% - 30px) !important;
				height: auto!important;
		}
		.article-links-wrapper {
				margin-left: 30px;
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
		right: 90px;
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
		right: 62px;
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
		padding-bottom: 5px;
		padding-top: 5px;
		width: 50%;
}
@media screen and (max-width: 700px) {
		.filter-list-wrapper {
				width: 100%;
		}
}
.filter-list-wrapper select {
		width: 70px;
}

.filter-view {
}
/*
				LIST
*/
.articles-list {
	width: 100%;
	overflow-x: hidden;
	height: calc(100% + 20px);
	overflow-y: scroll;
	
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * 
LIST
*/
.feed-app-wrapper {
	padding-top: 37px;
	width: calc(100%);
}

.top-wrapper {
	position: absolute;
    right: 2px;
	top: 4px;
}
.filters-top-wrapper {
	display: flex;
	align-items: center;
	padding-right: 25px;
}
.left-right-wrapper {
	display: flex;
	height: 100%;
}
.left-wrapper {
	height: 100%;
	overflow:hidden;
}
.hide-scrollbar {
	height: calc(100% - 40px);
	overflow-y: auto;
	min-width: 100px;
	width: calc(100% + 18px);
}
.right-wrapper {
	height: 100%;
	width: 100%;
}

.hide-scrollbar-right {
	height: 100%;
	width: calc(100%);
}

/* * * * * * * * * * *
LIST > LEFT WRAPPER  
*/
.left-wrapper.hidden {
	display: none;
}
.left-wrapper .filter {
	cursor:pointer;
	padding-left: 7px;
}
.left-wrapper .filter:nth-child(even) {
	background: #CCC;
}
.left-wrapper .filter:nth-child(odd) {
    background: #e3e3e3;
}

.left-wrapper .filter.active {
	font-weight: bold;
	background: ${mainColor};
	color:white;
}

/* * * * * * * * * * *
LIST > ARTICLES
*/

.articles-list.item-active-open {
		width: calc(50% - 30px);
}
@media screen and (max-width: 700px) {
	.articles-list.item-active-open {
			width: calc(100% - 30px);
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

.articles-list.view-gallery #infinite-scroll-inner {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
}
@media only screen and (hover: none) and (pointer: coarse) {
	.articles-list.view-gallery #infinite-scroll-inner {
		justify-content: left;
	}
}


.article-gallery-item {
		width: calc(50% - 20px);
		max-width: 310px;
		margin-left: 10px;
		margin-top: 0px;
		margin-bottom: 10px;
		border-radius: 7px;
		overflow: hidden;
		position: relative;
		cursor: pointer;
		max-height: 190px;
}

.article-gallery-item .meta  {
	position: absolute;
	bottom: 4px;
	color: #ffffff7d;
	font-size: 9px;
	margin-left: 11px;
	line-height: 10px;
}
.article-gallery-item .title-wrapper  {
}
.article-gallery-item .title  {
		margin: 0px 0px;
		position: absolute;
		padding: 10px;
		padding-top: 10px;
		padding-bottom: 10px;
		padding-top: 10px;
		word-break: break-word;
		width: calc(100% - 20px);
		bottom: 0px;
		font-size: 11px;
		font-weight: 800;
		color: #d7d6d6;
		background: linear-gradient(to top, #000, #0000);
		padding-top: 110px;
		padding-bottom: 24px;
		line-height: 12px;
}
.article-gallery-item .bg-item {
		width: 100%;
		min-height: 170px;
		background-size: cover;
		background-repeat: no-repeat;
		background-position: center;
}



/* full-width view  */

.articles-list.view-full-width #infinite-scroll-inner {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
}
@media only screen and (hover: none) and (pointer: coarse) {
	.articles-list.view-full-width #infinite-scroll-inner {
		justify-content: left;
	}
}


.article-full-width-item {
		width: calc(100% - 20px);
		max-width:320px; /* for desktop */
		margin-left: 10px;
		margin-top: 0px;
		overflow: hidden;
		position: relative;
		cursor: pointer;
		height: 240px;
}

.article-full-width-item .meta  {
	color: black;
	font-size: 9px;
	margin-left: 11px;
	line-height: 10px;
	position: relative;
	top: -1px;
}
.article-full-width-item .title-wrapper  {
}
.article-full-width-item .title  {
		margin: 0px 0px;
		padding: 10px;
		padding-top: 10px;
		padding-bottom: 10px;
		padding-top: 10px;
		word-break: break-word;
		width: calc(100% - 20px);
		bottom: 0px;
		font-size: 11px;
		font-weight: 800;
		color: black;
		line-height: 12px;
		max-height: 40px;
		overflow: hidden;
}
.article-full-width-item .bg-item {
		width: 100%;
		min-height: 170px;
		border-radius: 7px;
		background-size: cover;
		background-repeat: no-repeat;
		background-position: center;
}











.filter-toggle {
	cursor: pointer;
	padding: 7px;
    padding-top: 5px;
}

.filter-input {
		margin-left: 15px;
		width: 120px;
		border: 0px;
		box-shadow: 0px 0px 4px 0px rgba(0,0,0,0.2);
		border-radius: 5px;
		padding: 3px 4px;
}
.audio-wrapper audio {
		width: 100%;
}
.video-wrapper iframe {
		width: 100%;
}
.filter-input {
}
.filter-sort {
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
.fav {
		color: #dbcd03;
}
.article-status-fetch {
		padding: 10px;
		color: #b7b7b7;
}
.article-filter-links {
		font-size: 10px;
		color: grey;
		cursor: pointer;
}
.article-filter-links span {
	background: ${mainColor};
	color: white;
	border-radius: 5px;
    padding: 2px 7px;
    margin-right: 3px;
}
.article-filter-links span:hover {
	background: white;
	color: ${mainColor};
}


`;

// FA is included as requesting external ressources, so cannot be cached by tiro directly
		return `
<div id='root-react'></div>
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet"> 
`
}

window.initCustomTag = feedApp
