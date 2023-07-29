const plugin_infos = {
    images: [
        "https://github.com/dotgreg/tiro-notes/assets/2981891/ba1d0751-e140-45b0-aada-398cd27df896",
        "https://github.com/dotgreg/tiro-notes/assets/2981891/09c3ac6c-a15e-4bcd-8e92-26a879323c91",
    ],
    icon: "https://github.com/dotgreg/tiro-notes/assets/2981891/c3bc05a4-38b6-4355-b84d-6208cbf17c11",
    description: "Your news on Tiro (Rss, Youtube) <br/> this is a long description",
    versions: [
      {version: "1.0.12", date: "25/07/23", comment: "adaptation to plugin"},
      {version: "1.0.10", date: "15/07/23", comment: "column dev + redesign"},
      {version: "1.0.9", date: "31/03/23", comment: "isDev option added"},
    ],
    configuration: [
      {type: "checkbox", id:"feed-enable-youtube-ctag", description: "Enable [[feed-yt]] to get your own youtube page. More informations <a href=\"https://tiro.org\">here</a>"},
      {type: "text", id:"feed-youtube-api-key", description: "if youtube feed is enabled, you will need an API key to make it work"}
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
  
  

