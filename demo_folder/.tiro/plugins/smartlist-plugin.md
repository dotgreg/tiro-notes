const plugin_infos = {
    versions: [
     
    ]
  }

let tagName = "smartlist" 
let dev = 1            ; 
let disableCache= dev === 1    ;
let baseUrl = "http://localhost:8077/"
if(dev != 1)  baseUrl = "https://raw.githubusercontent.com/dotgreg/tiro-notes/dev/plugins/"

  
  return [
  {
    name: tagName,
    type: "tag",
    code: `
        [[script]]
            window.disableCache=${disableCache} ;
            return api.utils.loadCustomTag("${baseUrl}/${tagName}/${tagName}.ctag.js", \`{{innerTag}}\`, {size: "100%", padding: false})
        [[script]]
    `,
    plugin_infos,
  },
]