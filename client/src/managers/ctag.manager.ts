import { sharedConfig } from "../../../shared/shared.config"
import { getApi } from "../hooks/api/api.hook"
const h = `[CTAG MANAGER]`
let shouldLog = sharedConfig.client.log.verbose
shouldLog = true

// inside code app
// const getHardcodedTags = () => {
//     return {iframeOLD: iframeCtag}
// }
// if not present, fallback to download from dev/plugins github for the moment
const baseCtag = ["epub", "pdf", "iframe", "web", "smartlist", "proofread", "datatable", "forms", "timeline", "files"]
const getBaseCtagContent = (ctagName:string, cb:(txt:string)=>void) => {
  
  const url = `https://raw.githubusercontent.com/dotgreg/tiro-notes/dev/plugins/${ctagName}/${ctagName}.ctag.js`
  let addedOpts = ``
  if (ctagName === "epub") addedOpts = `open:true, size: "80%"`
  if (ctagName === "pdf") addedOpts = `open:true`
  if (ctagName === "web") addedOpts = `"search_engines": {
    "default":"https://search.bowlman.org/search?q=",
    "g":"https://www.google.com/search?q=",
    "m": "https://www.google.com/maps/search/"
  }`
  const baseCtagTxt = `
  [[script]]
  return api.utils.loadCustomTag("${url}",\`{{innerTag}}\`,{${addedOpts}})
  [[script]]
  `

  shouldLog && console.log(`${h} : ctag "${ctagName}" not present in tiro/tags but part of the base, return base config`, {baseCtagTxt})
  cb(baseCtagTxt)
}

const getCtagLegacyContent = (ctagName:string, cb) => {
  console.log(`${h} [CTAG BOOT] getApi for legacy ctag "${ctagName}" ...`)
  const apiWatchdog = setTimeout(() => {
    console.warn(`${h} [CTAG BOOT] APP API NOT READY after 10s — ctag "${ctagName}" cannot be fetched (client api promise pending)`)
  }, 10000)
  getApi(api => {
    clearTimeout(apiWatchdog)
    console.log(`${h} [CTAG BOOT] app API ready → file.getContent("/.tiro/tags/${ctagName}.md")`)
    api.file.getContent(`/.tiro/tags/${ctagName}.md`, ncontent => {
        console.log(`${h} [CTAG BOOT] file.getContent answered: ${ncontent ? `content len=${ncontent.length}` : 'NULL (file missing?)'}`)
        cb(ncontent)
    }, {
        onError: (err) => {
            console.log(`${h} [CTAG BOOT] file.getContent onError: ${err}`)
            // if not present, fallback to download from dev/custom-tags github for the moment
            if (baseCtag.includes(ctagName)) {
              console.log(`${h} [CTAG BOOT] falling back to BASE ctag "${ctagName}" (github)`) 
              getBaseCtagContent(ctagName, txt => {
                cb(txt)
              })
            } else {
              console.warn(`${h} [CTAG BOOT] no fallback for "${ctagName}" → cb(null) — tag will stay EMPTY`)
              cb(null)
            }
        }
    })
  })
}


export const getCtagContent = (ctagName: string, cb:(ctagContent:string|null) => void) => {
    // let intCtags = getHardcodedTags()
    // 1 HARDCODED
    // if (intCtags[ctagName]){
    //     cb(intCtags[ctagName])
    // } else {
      
    // 2 PLUGINS
    console.log(`${h} [CTAG BOOT] getCtagContent("${ctagName}") → plugins.get`)
    const apiWatchdog = setTimeout(() => {
      console.warn(`${h} [CTAG BOOT] APP API NOT READY after 10s — ctag "${ctagName}" cannot be resolved (client api promise pending?)`)
    }, 10000)
    getApi(api => {
      clearTimeout(apiWatchdog)
      api.plugins.get(ctagName, "tag", res => {
        console.log(`${h} [CTAG BOOT] plugins.get("${ctagName}") answered: ${res ? `type=${res.type}` : 'null'}`)
        if (res && res.type === "tag") {
          cb(res.code)
        } else {
          //3 W LEGACY CTAG SYSTEM FALLBACK
          if (ctagName === "iframe") ctagName = "web"
          getCtagLegacyContent(ctagName, res2 => {
            cb(res2)
          })
        }
      })
    })
        
    // }
}

export const getCtagList = () => {

}



//
// internal CTAGS
//
const iframeCtag = () => `
[[script]]
const style = \`<style>
.ctag-iframe-wrapper {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
#ctag-iframe {
  border: none;
  transform: scale(0.67);
  width: 150%!important;
  height: 150vh!important;
  transform-origin:top left;
}
</style>\`
const contentStyle = \`
<style>
img {
		max-width: 100%!important;
		height: auto!important;
}
body, html {
		font-family: sans-serif;
}
</style>
\`

let content = \`{{innerTag}}\`
let htmlHead = \`<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>\`
let htmlFooter = \`</body></html>\`

var meta = document.createElement('meta');
meta.charset = "utf-8";
window.document.head.appendChild(meta);
document.head.innerHTML += '<meta charset="utf-8">'

let iframeContent = ""
if (content.startsWith("http")) {
  iframeContent=\`src="\${content}"\`
} else {
  window.document.body.innerHTML =  contentStyle + decodeURIComponent(content) 
}

api.utils.resizeIframe("100%");
setTimeout(() => {
  api.utils.resizeIframe("100%");
}, 1000)


return \`\${style}<div class="ctag-iframe-wrapper"><iframe \${iframeContent} id="ctag-iframe"></iframe></div>\`

[[script]]
`
