const plugin_infos = {
    versions: [
      {version: "0.1.0", date: "14/02/24", comment: "init"},
    ]
  }

let disableCache = true
let baseUrl = "https://devd11111111111-3019-priv.websocial.cc/"
let libUrl =  baseUrl + "map/map.lib.js"
  
  return [
  {
    name: "map",
    type: "tag",
    code: `
        [[script]]
            window.disableCache=${disableCache} ;
            return api.utils.loadCustomTag("${baseUrl}/map/map.ctag.js", \`{{innerTag}}\`, {size: "100%", padding: false})
        [[script]]
    `,
    plugin_infos,
  },
]