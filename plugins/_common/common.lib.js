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

// export each as iEach in flow


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