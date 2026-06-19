const plugin_infos = {
    versions: [
        ]
  } 
  

let dev = 0           ; 
let disableCache= dev === 1    ;
let baseUrl = "http://localhost:8077/"
if(dev != 1)  baseUrl = "https://raw.githubusercontent.com/dotgreg/tiro-notes/dev/plugins/"


  return [
  {
    name: "feed",
    type: "tag",
    code: `
        [[script]]
            window.disableCache=${disableCache} ;
            return api.utils.loadCustomTag("${baseUrl}/feed/feed.js", \`{{innerTag}}\`, {
            size: "100%", 
            padding: false, 
            itemsPerFeed: 100, 
            feedLoadDelay: 500,
            contentCacheHours: 6
            })
        [[script]]
    `,
    plugin_infos,
  },
  {
    name: "feed-yt",
    type: "tag",
    code: `
        [[script]]
            window.disableCache=${disableCache} ;
            return api.utils.loadCustomTag("${baseUrl}/feed/feed.js", \`{{innerTag}}\`, 
            {
                size: "100%", 
                padding: false, 
                itemsPerFeed: 50, 
                feedType: "youtube",
                contentCacheHours: 6,
                youtubeKey: "ENTERYOUTUBEKEYHERE",
                youtubeTimeFilter : [5,100000] // in mins
            })
        [[script]]
    `,
    plugin_infos,
  },
]
  
  

