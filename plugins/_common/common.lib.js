//@flow 

let r = {}
r.getCachedVal = (idCache, cb) => {
}

r.generateHelpButton = (helpText, helpTitle) => {
    if (!helpTitle) helpTitle = "Help"
    window.helpButtonPopup = () => {
        // api.call('popup.show', '${helpText}', '${helpTitle}'])
        api.call('popup.show', [helpText, helpTitle])
    }
    let htmlButton = `
        <button onclick="helpButtonPopup()" class="btn btn-primary">Help</button>
    `
    return htmlButton

}

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
    // api.call('notification.show', [strToNotif])
	console.log("[NOTIF LOG]: ", str)
	if (!hideAfter) hideAfter = 60
	// getApi(api => {
	// 	api.ui.notification.emit({content: str,id, options:{ hideAfter, type:"warning", keepInHistory: true}})
	// })
    api.call('ui.notification.emit', [{content: str, id, options: { hideAfter, type: "warning", keepInHistory: true }}])
}
// export each as iEach in flow

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

// const commonLib = {getOperatingSystem, each, onClick}
const commonLib = r

if (!window._tiroPluginsCommon) window._tiroPluginsCommon = {}
window._tiroPluginsCommon.commonLib = commonLib

/*::
export type iCommonLib = typeof commonLib;
*/