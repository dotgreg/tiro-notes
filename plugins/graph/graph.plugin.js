const plugin_infos = {
    versions: [
      {version: "1.0.4", date: "30/12/23", comment: "adaptation to plugin + fix color bug"},
      {version: "1.0.3", date: "27/10/22", comment: ""},
    ]
  }
  
  let disableCache = true
  let baseUrl = "http://dev111111111111.websocial.cc:8088/"
  //baseUrl = "https://raw.githubusercontent.com/dotgreg/tiro-notes/dev/plugins/"
  
  return [
  {
    name: "graph",
    type: "tag",
    code: `
        [[script]]
            window.disableCache=${disableCache} ;
            return api.utils.loadCustomTag("${baseUrl}/graph/graph.ctag.js", \`{{innerTag}}\`, {size: "100%", padding: false})
        [[script]]
    `,
    plugin_infos,
  },
]