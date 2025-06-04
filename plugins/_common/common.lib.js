let r = {}
r.getCachedVal = (idCache, cb) => {
}

r.generateHelpButton = (helpText, helpTitle, label="?") => {
    if (!helpTitle) helpTitle = "Help"
    window.helpButtonPopup = () => {
        api.call('popup.show', [helpText, helpTitle])
    }
    let htmlButton = `
        <button onclick="helpButtonPopup()" class="btn btn-primary helpButton">${label}</button>
        <style> .helpButton {
            border: none;
            background-color: transparent;
            cursor: pointer;


        }</style> 
    `
    return htmlButton

}
r.commonUserAgents = () => [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36",
    // android 
    "Mozilla/5.0 (Linux; Android 10; Pixel 3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36",
    // macos
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    // iphone safari
    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
    // linux desktop

]

r.searchNote = (searchee, replacement) => {
    
    let infs = api.utils.getInfos()
    api.call('ui.note.editorAction.dispatch', [{
        type:"searchWord", 
        searchWordString: searchee,
        searchReplacementString: replacement || "",
        windowId: infs.windowId
    }])	
}


r.getOperatingSystem = () => {
    const platform = navigator.platform.toLowerCase();
    
    if (platform.includes('mac')) {
        return 'mac';
    } else if (platform.includes('win')) {
        return 'windows';
    } else if (platform.includes('linux')) {
        return 'linux';
    } else if (platform.includes('android')) {
        return 'android';
    } else {
        return 'other';
    }
}


const jsonToHTMLTable = (data) => {
    let wrapperClassName = ""
    let tableClassName = ""
  let html = `<div class="${wrapperClassName}">`;
  html += `<table class="${tableClassName}">`;
  html += "<tbody>";

  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      html += "<tr>";
      if (typeof data !== "array") {
        html += `<td>${key.replace(/_/g, " ")}</td>`;
      }

      if (data[key] && typeof data[key] === "object") {
        html += "<td>";
        html += jsonToHTMLTable(data[key], "", tableClassName);
        html += "</td>";
      } else {
        html += "<td>";
        html += `<span>${data[key]}</span>`;
        html += "</td>";
      }

      html += "</tr>";
    }
  }

  html += "</tbody>";
  html += "</table>";
  html += "</div>";

  return html;
}

///////////////////////////////////////////////////
// SUPPORT
//
r.getCache = (cacheId, onSuccess, onFailure) => {
    api.call("cache.get", [cacheId], content => {
        if (content !== undefined) onSuccess(content)
        else onFailure()
    })
}
r.setCache = (cacheId, content) => {
    api.call("cache.set", [cacheId, content, -1])
}

r.each = (itera/*: Array<any> | { [key: string]: any } */, cb/*:Function*/) => {
    if (itera.constructor === Array) {
            for (let i = 0; i < itera.length; ++i) {
                    cb(itera[i])
            }
    } else {
            for (const property in itera) {
                    cb(itera[property], property)
            }
    }
}

r.notifLog = (str, id, hideAfter) => {
	console.log("[NOTIF LOG]: ", str)
	if (!hideAfter) hideAfter = 60
    api.call('ui.notification.emit', [{content: str, id, options: { hideAfter, type: "warning", keepInHistory: true }}])
}

// r.getNoteContent = (path, cb) => {
//     api.call("file.getContent", [pathBookmarksFile], rawContent => {
//         let res = []
//         if (rawContent !== "NO_FILE") { res = JSON.parse(rawContent) }
//         bookmarks.current = res
//         if (cb) cb(res)
//     })
//     api.call('note.get', [noteId], (note) => {
//         cb(note.content)
//     })
// }


r.onClick = (elIds/*:string[]*/, action/*:Function*/) => {
    for (var i = 0; i < elIds.length; ++i) {
            let el = document.getElementById(elIds[i]);
            if (!el) return console.warn(`onclick: ${elIds[i]} does not exists`)
            const fn = (e) => { action(e, el) }
            el.removeEventListener("click", fn, false);
            el.addEventListener("click", fn, false);
    }
}

const commonLib = r

if (!window._tiroPluginsCommon) window._tiroPluginsCommon = {}
window._tiroPluginsCommon.commonLib = commonLib