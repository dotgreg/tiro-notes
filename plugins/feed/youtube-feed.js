const channelUrl = (name) => {
		name = name.substring(1)
		return `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${name}&key=${window.youtubeKey}`}


const f = (url, cb, failed=()=>{}) => {
		fetch(url)
			.then(response => response.json())
			.then(data => {cb(data)})
			.catch(err => {failed(err)})
}

const getUploadPlaylist = (feed, cb) => {
		let url = channelUrl(feed.url)
		f(url, obj => {
				let uploadPlaylist = obj.items ? obj.items[0]?.contentDetails?.relatedPlaylists?.uploads : null
				cb(uploadPlaylist)
		}, err => {
			console.log("[YOUTUBE] error fetching getUploadPlaylist",feed, err)
		})
}

const playlistUrl = (playlistId, nextToken) => {
		nextTokenStr = nextToken ? `&pageToken=${nextToken}` : ``
		return `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet%2CcontentDetails&maxResults=50&playlistId=${playlistId}&key=${window.youtubeKey}${nextTokenStr}`
}

const getVideoTime = (raw) => {
		let res =[0,0,0]
		let split = raw
		if (raw.includes("H")) {
				split = split.split("H")
				res[0] = parseInt(split[0])
				split = split[1]
		}
		if (raw.includes("M")) {
				split = split.split("M")
				res[1] = parseInt(split[0])
				split = split[1]
		}
		if (raw.includes("S")) {
				split = split.split("S")
				res[2] = parseInt(split[0])
		}
		res = (res[0]*60*60) + (res[1]*60) + res[2]
		return res
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

										let raw = vid.contentDetails.duration.replaceAll("PT","")
										let time = getVideoTime(raw)
										let mins = Math.round(time/60) 
										let timeFilter = window.youtubeTimeFilter
										if (timeFilter && Array.isArray(timeFilter)) {
												if (mins < timeFilter[0] || mins > timeFilter[1]) {
														// console.log(`[YOUTUBE] time filtered item ${it.title}`, it);
														it.hidden = true
												}
										}
										it.videoDetails.durationMin = Math.round(time/60) 
								}
						})
					})
			cb(vItems)
		}, err => {
			console.log("[YOUTUBE] error fetching getVideosDetails", err)
		})
}


const getItemsRecurr = (p) => {
		let {playlistId, items, recurrCounter,  limitFetchNb, nextToken, cb} = p
		let url = playlistUrl(playlistId, nextToken)
		if (recurrCounter > 0 && !nextToken) return cb(items)
		f(url, obj => {
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
    	}, err => {
			console.log("[YOUTUBE] error fetching ",url, err)
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

const processItems = (items) => {
		const fitems = []
		each(items, i => {
				if (i.snippet.title !== "Private video") {
						fitems.push({
								title: `${i.snippet.title} - ${i.videoDetails?.durationMin}m`,
								pubDate: i.snippet.publishedAt,
								hidden: i.hidden || false,
								image: i.snippet.thumbnails?.high?.url,
								link: `https://youtube.com/watch?v=${i.snippet.resourceId.videoId}`,
								description: i.snippet.description,
								enclosure : {
										videoId: i.snippet.resourceId.videoId, 
										type: "video",
										videoUrl : `https://www.youtube.com/embed/${i.snippet.resourceId.videoId}?autoplay=0`,
										videoDetails: i.videoDetails
								}
						})
				}
		})
				return fitems
}

const youtubeChannelToId = (channelName, cb) => {
	channelName = channelName.startsWith("@") ? channelName : `@${channelName}`
	let channelUrl = `https://www.youtube.com/${channelName}`
	api.call("ressource.fetch", [channelUrl, { disableCache: false }], resTxt => {
	// api.ressource.fetch(channelUrl, res => {
		arr1 = resTxt.split(`href="https://www.youtube.com/channel/`); 
		arr2 = arr1[1].split(`"`)[0]; 
		
		if (arr2.length > 10 && arr2.length < 40) {
			console.log(`[YOUTUBE] channel id found for ${channelUrl}`, arr2)
			cb(arr2)
		}
		else console.error(`YT error could not fetch id of ${channelUrl}`)
	})
}
	// youtubeChannelToId("justinetbee", res => {console.log(res)})

const fetchItems = (feed, cb) => {
		//
		// CHANNEL
		// if url starts with @, load the channel and    take the upload playlist id
		if (feed.url.startsWith("@")) {
				const fetchPlaylistsFromChannel = () => {
					getUploadPlaylist(feed, playlistId => {
						if (!playlistId) return cb([])
						getItemsPlaylist(playlistId, items => {
								cb(processItems(items))
						}, feed.limitFetchNb)
					})
				}
				if (feed.url.startsWith("@UC"))  {
					fetchPlaylistsFromChannel()
				} else {
					youtubeChannelToId(feed.url, id => {
						feed.url = `@${id}`
						fetchPlaylistsFromChannel()
					})
				}
		} else {
			//
			// PLAYLIST
			//
				// otherwise, consider it as a playlist id
				getItemsPlaylist(feed.url, items => {
						cb(processItems(items))
				}, feed.limitFetchNb)
		}

}

window.fetchYoutubeItems = fetchItems
