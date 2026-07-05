const plugin_infos = {
    versions: [
      {version: "1.0.0", date: "25/01/25", comment: "initial plugin"},
    ]
  } 

let tagname = "epub"
let filePath = "epub/epub" // add 2 here 
let dev = 1              ; 
let disableCache= dev === 1    ;
let baseUrl = "http://localhost:8077/"

if(dev != 1)  baseUrl = "https://raw.githubusercontent.com/dotgreg/tiro-notes/dev/plugins/"
 
  return [
  {
    name: tagname,
    type: "tag",
    code: `
        [[script]]
            window.disableCache=${disableCache} ;
            return api.utils.loadCustomTag("${baseUrl}/${filePath}.ctag.js", \`{{innerTag}}\`, {size: "100%", padding: false, formId: "form insert epub"})
        [[script]]
    `,
    plugin_infos,
  },
]
  
  

