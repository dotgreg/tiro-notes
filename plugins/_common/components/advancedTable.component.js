// assuming react is already loaded in window
// assuming     <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet"> is loaded in html



let genAdvancedTableComponent = (p) => {
    const api = window.api;
    const startMainLogic = () => {
        console.log("hello world advanced table")
        const wrapperEl = document.getElementById("ctag-component-advanced-table-wrapper")
        wrapperEl.innerHTML = `
            <div> hello world advanced table ${JSON.stringify(p)} </div>
        `
    }
    api.utils.loadRessources(
        [
            `https://cdn.jsdelivr.net/npm/@tarekraafat/autocomplete.js@10.2.7/dist/autoComplete.min.js`,
        ],
        () => {
            startMainLogic()
        }
    );
    
    return `<div id="ctag-component-advanced-table-wrapper"> loading...  </div>` 
}


if (!window._tiroPluginsCommon) window._tiroPluginsCommon = {}
window._tiroPluginsCommon.genAdvancedTableComponent = genAdvancedTableComponent


git config --global user.email "g@ksv3"; git config --global user.name "g@ksv3"