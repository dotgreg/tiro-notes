const channelUrl = (name) => {
		name = name.substring(1)
		return `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forUsername=${name}&key=${window.youtubeKey}`}


const f = (url, cb) => {
		fetch(url)
				.then(response => response.json())
				.then(data => {cb(data)});
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
		return `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet%2CcontentDetails&maxResults=50&playlistId=${playlistId}&key=${window.youtubeKey}${nextTokenStr}`
}

const getVideosDetails = (vItems, cb) => {
		let idsString = ``
		each(vItems, (i) => {
				idsString += `${i.contentDetails.videoId},`
		})
				idsString = idsString.substring(0, idsString.length - 1)
		let url = `https://www.googleapis.com/youtube/v3/videos?id=${idsString}&part=contentDetails&key=${window.youtubeKey}`
		f(url, obj => {
				each(obj.items, vid => {
						each(vItems, it => {
								if(it.contentDetails.videoId === vid.id) {
										it.videoDetails = vid.contentDetails
										it.videoDetails.durationMin = vid.contentDetails.duration.replaceAll("PT","").split("M")[0]
								}
						})
								})
						cb(vItems)
		})
}


const getItemsRecurr = (p) => {
		let {playlistId, items, recurrCounter,  limitFetchNb, nextToken, cb} = p
		let url = playlistUrl(playlistId, nextToken)
		f(url, obj => {
				// console.log("INTERM", playlistId, recurrCounter, items.length, limitFetchNb, nextToken,  url,)
				let nToken = obj.nextPageToken
				let nitems1 = obj.items
				getVideosDetails(nitems1, nitems2 => {
						items = [...items, ...nitems2]
						if (recurrCounter > 0 && !nextToken) {
								cb(items)
						} else if (items.length <= limitFetchNb ) {
								recurrCounter++
								getItemsRecurr({playlistId, items, limitFetchNb, cb, recurrCounter, nextToken: nToken}) 
						} else  {
								cb(items)
						}
				})
    })
}


const getItemsPlaylist = (playlistId, cb, limitFetchNb) => {
		let recurrCounter = 0
		getItemsRecurr({
				playlistId, 
				items: [], 
				limitFetchNb, 
				recurrCounter,
				cb: items => {
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
						title: `${i.snippet.title} - ${i.videoDetails.durationMin}m`,
						pubDate: i.snippet.publishedAt,
						image: i.snippet.thumbnails.high.url,
						link: `https://youtube.com/watch?v=${i.snippet.resourceId.videoId}`,
						description: i.snippet.description,
						enclosure : {
								videoId: i.snippet.resourceId.videoId, 
								type: "video",
								videoUrl : `https://www.youtube.com/embed/${i.snippet.resourceId.videoId}?autoplay=1`,
								videoDetails: i.videoDetails
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

window.fetchYoutubeItems = fetchItems
