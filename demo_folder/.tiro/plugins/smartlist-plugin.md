const plugin_infos = {
    versions: [
     
    ]
  }

let tagName = "smartlist" 
let dev = 1            ; 
let disableCache= dev === 1    ;
let baseUrl = "https://devd11111111111-3019-priv.websocial.cc"
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