const plugin_infos = {
    versions: [
      {version: "1.0.12", date: "25/07/23", comment: "adaptation to plugin"},
      {version: "1.0.10", date: "15/07/23", comment: "column dev + redesign"},
      {version: "1.0.9", date: "31/03/23", comment: "isDev option added"},
    ]
  }
  
  let disableCache = true
  let baseUrl = "http://dev111111111111.websocial.cc:8088/"
  //baseUrl = "https://raw.githubusercontent.com/dotgreg/tiro-notes/dev/plugins/"
  
  return [
  {
    name: "feed",
    type: "tag",
    code: `
        [[script]]
            window.disableCache=${disableCache} ;
            return api.utils.loadCustomTag("${baseUrl}/feed/feed.js", \`{{innerTag}}\`, {size: "100%", padding: false, itemsPerFeed: 50})
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
                youtubeKey: "AIzaSyAuwZNF7EEsZIv0RZ3Xbn2W5mY7svNpQJ0",
                youtubeTimeFilter : [5,100000] // in mins
            })
        [[script]]
    `,
    plugin_infos,
  },
]
  
  

