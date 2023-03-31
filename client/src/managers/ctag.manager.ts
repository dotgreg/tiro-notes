import { getApi } from "../hooks/api/api.hook"

const getInternalCtags = () => {
    return {iframe: iframeCtag}
}

export const getCtagContent = (ctagName: string, cb:(ctagContent:string|null) => void) => {
    let intCtags = getInternalCtags()
    if (intCtags[ctagName]){
        cb(intCtags[ctagName])
    } else {
        getApi(api => {
            api.file.getContent(`/.tiro/tags/${ctagName}.md`, ncontent => {
                cb(ncontent)
            }, {
                onError: () => {
                    cb(null)
                }
            })
        })
    }
}



//
// internal CTAGS
//
const iframeCtag = () => `
[[script]]
const style = \`<style>
#iframe {
// width: 100vw;
// height: 100vh;
border: none;
transform: scale(0.65);
  width: 150%!important;
  height: 140vh!important;
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
return \`\${style}<iframe \${iframeContent} id="iframe"></iframe>\`

[[script]]
`
const iframeCtag2 = () => `[[script]]
const api = window.api
console.log(window, api, 2222);

let content = decodeURIComponent("{{innerTag}}")
let srcParam = content.startsWith('http') ? \`src="\${content}"\` : \`srcDoc="\${content}"\`

const html = \`<div class="iframe_wrapper">
<iframe secure="true" id="iframe" \${srcParam} style="border:none;padding:0px;margin:0px;"></iframe>
</div>
<style>
  .iframe_wrapper {
    width: 100%!important;
    height: 100vh!important;
  }
  #link_iframe {
    position: absolute;
    z-index: 1000000;
    top: 5px;
    right: 30px;
  } 
  #iframe {
  transform: scale(0.65);
  width: 150%!important;
  height: 140vh!important;
  transform-origin:top left;
}
</style>\`


const {div, updateContent} = api.utils.createDiv()

api.utils.resizeIframe("97%")
setTimeout(() => {
   updateContent(html)
 }, 100)

return div;
[[script]]`
