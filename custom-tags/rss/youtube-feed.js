[[script]]
window.disableCache=true;

const youtubeKey = `AIzaSyAJo-lbUEWpsLgErczJYH99ABfuoM81VQc`

const channelUrl = (name) => {
		name = name.substring(1)
		return `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forUsername=${name}&key=${youtubeKey}`}


const f = (url, cb) => {
		api.call("ressource.fetch", [url, { disableCache: true }], txt => {
				cb(JSON.parse(txt))
		})
}

const getUploadPlaylist = (feed, cb) => {
		let url = channelUrl(feed.url)
		f(url, obj => {
				let uploadPlaylist = obj.items ? obj.items[0]?.contentDetails?.relatedPlaylists?.uploads : null
				cb(uploadPlaylist)
		})
}

const playlistUrl = (playlistId, nextToken) => {
		nextTokenStr = nextToken ? `&pageToken=${nextToken}` : ``
		return `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet%2CcontentDetails&maxResults=50&playlistId=${playlistId}&key=${youtubeKey}${nextTokenStr}`
}


const getItemsRecurr = (p) => {
		let {playlistId, items, limitFetchNb, nextToken, cb} = p
		let url = playlistUrl(playlistId, nextToken)
		f(url, obj => {
				//console.log("INTERM",nextToken, url, items.length)
				let nToken = obj.nextPageToken
				let nitems = obj.items
				items = [...items, ...nitems]
				if (recurrCounter > 0 && !nextToken) {
						cb(items)
				} else if (items.length < limitFetchNb ) {
						getItemsRecurr({playlistId, items, limitFetchNb, cb, nextToken: nToken}) 
        } else  {
						cb(items)
        }
        recurrCounter++
    })
}

let recurrCounter = 0
const getItemsPlaylist = (playlistId, cb, limitFetchNb) => {
		getItemsRecurr({
				playlistId, 
				items: [], 
				limitFetchNb, 
				cb: items => {
						//console.log("FINAL FETCH", items.length)
						cb(items)
				}, 
		})
}

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

const processItems = items => {
		const fitems = []
		each(items, i => {
				fitems.push({
						title: i.snippet.title,
						pubDate: i.snippet.publishedAt,
						image: i.snippet.thumbnails.high.url,
						link: `https://youtube.com/watch?v=${i.snippet.resourceId.videoId}`,
						description: i.snippet.description,
						enclosure : {
								videoId: i.snippet.resourceId.videoId, 
								type: "video"
						}
				})
		})
				return fitems
}

const fetchItems = (feed, cb) => {
		// if url starts with @, load the channel and    take the upload playlist id
		if (feed.url.startsWith("@")) {
				getUploadPlaylist(feed, playlistId => {
						if (!playlistId) return cb([])
						getItemsPlaylist(playlistId, items => {
								cb(processItems(items))
						}, feed.limitFetchNb)
				})
		} else {
				// otherwise, consider it as a playlist id
				getItemsPlaylist(feed.url, items => {
						cb(processItems(items))
				}, feed.limitFetchNb)
		}

}

return api.utils.loadCustomTag("http://localhost:8080/rss/rss.js", `{{innerTag}}`, 
															 {
																	 size: "100%", 
																	 padding: false, 
																	 itemsPerFeed: 50, 
																	 fetchItems
															 })
[[script]]
