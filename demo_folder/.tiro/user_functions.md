/*
```js
*/

// 
// 
// CONFIG
//
//

let searxUrlBase = "searxng.world"
searxUrlBase = "search.rhscz.eu"
searxUrlBase = "searx.be"


//
// TUTOS
// if 403 image > SEARCH AND DL IMAGE
// if does not work, try opening to bypass security ON THE PHONE!!!

// 
// 
// FOR DB
//
//

// function that detects if there is an hyperlink in the string, if yes, 
window.addLink = (contentCell, name) => {
       if (typeof contentCell === "string" && contentCell.includes("http") ) {
           if (contentCell.endsWith("/")) contentCell = contentCell.trim().slice(0, -1);
           let regex = /(https?:\/\/[^\s]+)/g;
           
          contentCell = contentCell.replace(regex, (url) => {
              if (!name) name = url
            return `<a href="${url}" target="_blank">${name}</a>`;
          });
    } 
    return contentCell
}










// // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // 
// 
// DIVERTISS VIEW MAIN FUNCTION
//
//

const getSearchedImage = (stringToSearch, cb, idCache, imageIndex, item, action) => {
        let log = true
         console.log(11,stringToSearch, cb, idCache, imageIndex, item)
        let h = "[getSearchedImage] =>"
      // log && console.log(h, {stringToSearch, cb, idCache, imageIndex, item, action})
     
     let idCacheFull = idCache + stringToSearch + imageIndex
     let idCacheString = idCache + stringToSearch 

     // OPEN WINDOW FLOATING
     let path = item.folder + item.filename
     let searchee = item.line
     // // // // // // // // // // // // // // // // // // // // // // // 
    // JS FUNCTIONS ON CLICK
    // 

     // ACTION
     action = action.trim()
     if (!action) {
         action = ""
     }
     
     let actionHtml = ""
     let actionEditFn = () => {window.searchItemInWindow(`${path}`,`${searchee}`)}
     let actionFn = actionEditFn
     let actionEditHtml = `<span style="position: absolute; padding: 4px; bottom: 0px; right: 18px; z-index: 10;" onClick="window.searchItemInWindow(\`${path}\`,\`${searchee}\`)" > ✎ </span> `
      console.log(223)
     
     actionExists = false
     if (action.length > 1 && action !== "false") {
         actionHtml = actionEditHtml
         actionExists = true
     } else {
         actionExists = false
     }
     //console.log({action, item, actionExists, actionFn})
     
     if (action.startsWith("downloadBat")) {
         let pathExe = action.replaceAll("downloadBat", "").trim()
         actionFn = () => {window.downloadBat(`${pathExe}`)}
     }
      if (action.startsWith("exec")) {
         let pathExe = action.replaceAll("exec", "").trim()
         actionFn = () => {window.execLocal(`${pathExe}`)}
     }
     //▶
      if (action.startsWith("note")) {
         let pathNote = action.replaceAll("note", "").trim()
         actionFn = () => {window.searchItemInWindow(`${pathNote}`,``)}
     }
     console.log(2234)
     window[`actionFn${idCacheFull}`] = actionFn
     window[`actionExists${idCacheFull}`] = actionExists



    // // // // // // // // // // // // // // // // // // // // // // // 
    //  RENDER THE FINAL HTML
    // 
     let renderHtmlAndCB = res => {
          let infs = api.utils.getInfos()
          //console.log(123, infs, item)
          res = res.split("?token=")[0]
         res = res + `?token=${infs.loginToken}`
         console.log(66, {res})
         html = `
         <img width="40px" src="${res}" onClick="window[\`actionFn${idCacheFull}\`]()"  />
         
         
         
         <span class="overlay"   style="position: absolute; padding: 10px; top: 0px; left: 0px; z-index: 10; width: calc(100% - 20px); height: calc(100% - 20px); overflow:scroll; transition: all 0.2s; background: rgba(255,255,255,0.9) ; opacity:0; transition: all 0.1;" >
             <span class="overlay-content">
                 <b style="${window[`actionExists${idCacheFull}`] ? "color:blue;" : ""} font-size: 16px; text-transform: capitalize; " onClick="window[\`actionFn${idCacheFull}\`]()"> ${stringToSearch} </b> 
                 <br><br>
                 <span class="link" onClick="window[\`actionFn${idCacheFull}\`]()" > ${window[`actionExists${idCacheFull}`] ? "▶️START" : ""} </span>
                 <span class="link" onClick="window.openNewTab(\`${stringToSearch}\`)"> 🔎infos </span>
                 <span class="link" onClick="window.openNewTabDownload(\`${stringToSearch}\`)"> ⬇️download </span>
                 <span class="link" onClick="window.openImagesSelector(\`${stringToSearch}\`)"> 🖼️image </span>
                 <span class="link" onClick="window.searchItemInWindow(\`${path}\`,\`${searchee}\`)" > ✏️edit </span>
                 <span class="link"  onClick="window.downloadContentTextAndDisplay(event, \`${stringToSearch} ${item.type} wikipedia\`)"> 🔎 summary </span>
                 <br><br>
                 <span class="description"> ${item.commentaire || ""}</span>
             </span> 
         </span> 
         
         <style>
         body {background: #242424!important;} 
          .ctag-component-table-grid-view .grid-item {max-height: none; height: 270px; width:180px; } 
         .grid-item:hover .overlay { opacity:1!important;   }
          .grid-item .overlay .link { color:blue; text-decoration: underline; margin-right: 5px;  }
         </style>
         `
         console.log(2236)
         cb(html )
     }



     // // // // // // // // // // // // // // // // // // // // // // // 
    //  EXEC THE WHOLE LOGIC FOR IMAGE CACHING
    // 
    api.call("cache.get", [idCacheFull], res => {
        console.log(112, res)
        if (res) {
            console.log(113)
            //log && console.log(h, `🖼️✅ ${stringToSearch} ` , {res})
            renderHtmlAndCB(res)
        } else {
            console.log(114)
            log && console.log(h, `🖼️❌  ${stringToSearch}, 🔎...` )
           searchImage(stringToSearch, images => {
               console.log(115)
                let url = images[imageIndex] + "?nocache="+idCacheFull
                log && console.log(h, `🔎✅ ${stringToSearch} >>`, {images, url, imageIndex} )
                
                // FETCH THE IMAGE FROM THE LIST AND SAVE IT LOCALLY
                api.call("ressource.fetch", [url, {returnsPathOnly:true, persistentCache:true}], (cachedUrl) => {
                   let relCacheUrl = "/static/" + cachedUrl.split("/static/")[1] // do NOT TOUCH the 1 here
                     api.call("cache.set", [idCacheFull, relCacheUrl, -1])
                    log && console.log(h, `📥🖼️ ✅  ${stringToSearch} `, {relCacheUrl})
                    renderHtmlAndCB(relCacheUrl)
                })
            })
        } // endif
    })// endcall




    
}
 









// // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // 
// 
// SUPPORT FNs
// 



 ///////////////////////////////////
 //  SEARCH AND DL IMAGE
 //
 let headers = [
    ["User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0"],
    ["Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"],
    ["Accept-Language", "en-US,en;q=0.5"],
    ["Accept-Encoding", "gzip"],
    ["Connection", "keep-alive"],
    ["Pragma", "no-cache"],
    ["Cache-Control", "no-cache"],
    ["Origin", "https://searx.be"],
    ["Referer", "https://searx.be/"],
    ["Sec-Fetch-Dest", "document"],
    ["Sec-Fetch-Mode", "navigate"],
    ["Sec-Fetch-Site", "cross-site"],
    ["Sec-Fetch-User", "?1"],
    ["Sec-GPC", "1"],
    ["TE", "trailers"]
  ]
  
const searchImage = (stringToSearch, cb) => {
    
    
    function extractImageUrlsBing(htmlString) {
        htmlString = htmlString.replaceAll("&quot;", " ");
        const regex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|htm|html|php))/gi;
        let res = htmlString.match(regex) || []
        // only keep when ends with jpg, jpeg, png
        res = res.filter(url => url.endsWith('jpg') || url.endsWith('jpeg') || url.endsWith('png'))
        return res;
    }
    function extractImageUrlsDdg(htmlString) {
        htmlString = htmlString.replaceAll("&quot;", " ");
        const regex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|htm|html|php))/gi;
        let res = htmlString.match(regex) || []
        // only keep when ends with jpg, jpeg, png
        res = res.filter(url => url.endsWith('jpg') || url.endsWith('jpeg') || url.endsWith('png'))
        return res;
    }
    function extractImageUrlsYan(htmlString) {
        htmlString = htmlString.replaceAll("&quot;", " ");
        const regex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|htm|html|php))/gi;
        let res = htmlString.match(regex) || []
        // only keep when ends with jpg, jpeg, png
        res = res.filter(url => url.endsWith('jpg') || url.endsWith('jpeg') || url.endsWith('png'))
        // discard duplicates
         res = [...new Set(res)];
        return res;
    }
    function extractImageUrlsSearx(htmlString) {
        htmlString = htmlString.replaceAll("&quot;", " ");
        const regex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|htm|html|php))/gi;
        let res = htmlString.match(regex) || []
        // only keep when ends with jpg, jpeg, png
        res = res.filter(url => url.endsWith('jpg') || url.endsWith('jpeg') || url.endsWith('png'))
        // discard duplicates
         res = [...new Set(res)];
        return res;
    }


 let headersBing = [
    ["Pragma", "no-cache"],
    ["Cache-Control", "no-cache"],
    ["Origin", "https://www.bing.com"],
    ["Referer", "https://www.bing.com/"],
    ["Sec-Fetch-Site", "cross-site"],
    ["Sec-GPC", "1"],
    ["TE", "trailers"],
["User-Agent", "Mozilla/5.0 (X11; Linux x86_64; rv:144.0) Gecko/20100101 Firefox/144.0"],
    ["Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"],
    ["Accept-Language", "en-US,en;q=0.5"],
    ["Connection", "keep-alive"],
["Accept-Encoding", "gzip"],
    ["DNT", "1"],
    ["Host", "www.bing.com"],
    ["Priority", "u=0, i"],
    ["Sec-Fetch-Dest", "document"],
    ["Sec-Fetch-Mode", "navigate"],
    ["Sec-Fetch-User", "?1"],
    ["Upgrade-Insecure-Requests", "1"]
  ]
  
 //
 // THE LAST IN THE LIST IS THE ONE USED
 //
let url = ""
let exctractImageFn  = ""
let stringToSearchNoSpace = stringToSearch.replaceAll(" ", "%20")
  // yandex
     url = "https://yandex.com/images/search?from=tabbar&text="+stringToSearch+""
     exctractImageFn = extractImageUrlsYan
  
  // SEARX
  url = "https://"+searxUrlBase+"/search?q="+stringToSearch+"&categories=images&language=auto&time_range=&safesearch=0&theme=simple"
exctractImageFn = extractImageUrlsSearx

 // BING
     url = "https://www.bing.com/images/search?q="+stringToSearchNoSpace+"&first=1"
     url = "https://www.bing.com/images/search?q="+stringToSearch+"&first=1"
    exctractImageFn = extractImageUrlsBing
    headers = headersBing
    headers=false





    console.log("🔍 searchImag ->", url) 

    //headers:headers,
    
    api.call("ressource.fetch", [url, { disableCache:false}], html => {
        let images = exctractImageFn(html)
        // console.log(2222222222, html, images)
        //if (html.includes("too many request")) alert("too many requests =>" + html)
        if (images.length === 0) alert("could not any images (length = 0), probably scrapping getting blocked. try accessing it using normal browser \n\n " + html)
        console.log("🔍 searchImag 2 -> result", images, {html}) 
        cb(images)
    })
    
    return ""
}

 ///////////////////////////////////
 // downloadContentTextAndDisplay 
 //
window.downloadContentTextAndDisplay = (event, stringToSearch) => {
     event.target.classList.remove("link")
    event.target.innerHTML = "loading summary..."
    url = "https://"+searxUrlBase+"/search?q="+stringToSearch+" &language=en&time_range=&safesearch=0&theme=simple"
    url = "https://html.duckduckgo.com/html/?q=" +stringToSearch
    console.log("🔍 searchImag ->", url, ) 
    api.call("ressource.fetch", [url ], htmlTxt => {
              console.log(2222222222, htmlTxt)
              // create a DOM parser 
                let parser = new DOMParser();
                // parse the HTML string into a document
                let ndocument = parser.parseFromString(htmlTxt, 'text/html');
                // let ndocument = parser.parseFromString(testPageHtml, 'text/html');
                // get all path_Block queryall js
                
                let blocks = ndocument.querySelectorAll(".result__snippet")
                console.log(blocks)
                // loop the 3 first iterations of blocks, and concat their text together in outputText var
                let outputText = "";
                let nbToOuput = blocks.length > 5 ? 5 : blocks.length
                for (let i = 0; i < 5 && i < blocks.length; i++) {
                    outputText += `<br> ========<br> ${blocks[i].textContent} `    
                }
                 console.log(outputText);
                event.target.innerHTML = outputText
        })
}
 
 ///////////////////////////////////
 // OPEN IMAGES EXPLORER WINDOW
 //
  window.openImageSequence = (str, imageUrls)  => {
      const newWindow = window.open('', 'ttt', 'width=800,height=600');
      let content = `<h3> results for :<a href="https://www.google.com/search?q=${str}" target="_bank" > ${str } </a></h3><br><br>`;
      let nb = 0;
      imageUrls.forEach(url => {
      
        content += `<div style="padding:5px; display:inline-block">${nb}<img src="${url}" style=""></div>`;
        nb++
      });
      content+=`
      <style>
      img {display: inline-block; max-width: 200px; max-height: 200px;}
      </style>
      `
      
      newWindow.document.body.innerHTML = content;
}

    

//////////////////////////////////// 
// ACTION FN
//

window.searchItemInWindow = (path, searchee) => {
        api.call("ui.floatingPanel.openFile", [path, { 
                searchedString:searchee, 
                idpanel: "id-panel-smartlist-preview", 
                view: "editor",
                layout: "top-right"
        }])
}

window.execLocal = (cmd) => {
    // if cmd starts with edf, 
    // if (cmd.startsWith("edf") cmd.replace("edf:","C:\Users\gthiebault\OneDrive%20-%20EDF%20Renouvelables\_SHARED_donotmove\")
    const newWindow = window.open(`http://localhost:9999/?path=${cmd}`, 'exec', 'width=300,height=100');
     setTimeout(() => {
        newWindow.close();
      }, 6000);
}


window.downloadBat = (pathExe) => {
    const content = `start "" "${pathExe}"`;
    const filename = 'runApp.bat';
    
    const blob = new Blob([content], { type: 'application/bat' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
  
}




window.openNewTab = (str) => {
  const urlToOpen = `https://www.google.com/search?q=${encodeURIComponent(str)}`;
  window.open(urlToOpen, '_blank');
};
window.openNewTabDownload = (str) => {
  const urlToOpen = `https://www.ygg.re/engine/search?name=${str}&description=&file=&uploader=&category=all&sub_category=&do=search`
  window.open(urlToOpen, '_blank');
};


window.infoPopup = (str) => {
const newWindow = window.open(`https://www.google.com/search?q=${str}`, 'ttt', 'width=800,height=600');
}
window.downloadPopup = (str) => {
str = str.replaceAll(" ", "+")
const newWindow = window.open(`https://www.ygg.re/engine/search?name=${str}&description=&file=&uploader=&category=all&sub_category=&do=search`, 'ttt', 'width=800,height=600');
}

window.openImagesSelector = (str) => {
    searchImage(str, images => {
        window.openImageSequence(str, images)
    })
}










    