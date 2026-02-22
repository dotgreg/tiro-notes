const plugin_infos = {
    versions: [
      {version: "1.0.12", date: "25/07/23", comment: "adaptation to plugin"},
      {version: "1.0.10", date: "15/07/23", comment: "column dev + redesign"},
      {version: "1.0.9", date: "31/03/23", comment: "isDev option added"},
    ]
  } 
  


let dev = 0           ; 
let disableCache= dev === 1    ;
let baseUrl = "https://devd11111111111-3019-priv.websocial.cc"
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
  
  

