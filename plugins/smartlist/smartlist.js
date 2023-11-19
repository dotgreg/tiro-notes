// 10.10.2023 v1.1
const smartlistApp = (innerTagStr, opts) => {
    const { div, updateContent } = api.utils.createDiv()

    const outputPaths = {  }

        ///////////////////////////////////////////////////
        // SUPPORT
        //
        const each = (itera, cb) => {
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

        const onClick = (elIds, action) => {
                for (var i = 0; i < elIds.length; ++i) {
                        let el = document.getElementById(elIds[i]);
                        if (!el) return console.warn(`onclick: ${elIds[i]} does not exists`)
                        el.addEventListener("click", e => { action(e) }, false);
                }
        }
        ///////////////////////////////////////////////////////////
        // 
        // MAIN LOGIC
        //
        ///////////////////////////////////////////////////////////

        const startMainLogic = () => {
                const api = window.api;

                const searchWord = (word, path, cb) => {
                        api.call("search.word", [word, path], content => {
                                        cb(content)
                        })
                }

                // split EDF TODO | # | /etc/blabla
                        // INVEST | # | /etc/blabla in a config array of objects with category, searchTag and path
                let configArray = []
                innerTagStr.split("\n").forEach((el, i) => {
                        if (el.indexOf("|") > -1) {
                                let [category, searchTag, path] = el.split("|")
                                // trim all
                                category = category.trim()
                                searchTag = searchTag.trim()
                                path = path.trim()
                                configArray.push({ category, searchTag, path })
                        }
                })
                // document.getElementById("smart-list-ctag").innerHTML = JSON.stringify(configArray)
                // for each config, create a div with a title and a list
                const wrapperEl = document.getElementById("smart-list-ctag-inner")
                each(configArray, (el, i) => {
                        // searchWord(el.searchTag, el.path, content => {
                        //         wrapperEl.innerHTML += `
                        //         <h3> ${el.category} </h3>
                        //         <div> ${JSON.stringify(content)} </div>
                        // `  })
                })

                wrapperEl.innerHTML = window._tiroPluginsCommon.genAdvancedTableComponent({woop:"wooooooooooop"})


        }
    

        const genHtmlAndStyle = () => {
                // FA is included as requesting external ressources, so cannot be cached by tiro directly
                let res = `
                <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet"> 
                <div id="smart-list-ctag"> 
                        <div id="smart-list-ctag-inner"> 
                        </div>
                        
                        <div> hello world smartlist </div>
                </div>

                <style>
                        #smart-list-ctag {
                        }
                              
                </style> `
                return res
        }


        setTimeout(() => {
                setTimeout(() => {
                        api.utils.resizeIframe("100%");
                }, 100)
                setTimeout(() => {
			api.utils.loadRessources(
				[
					`https://cdn.jsdelivr.net/npm/@tarekraafat/autocomplete.js@10.2.7/dist/autoComplete.min.js`,
                                        `https://cdn.jsdelivr.net/npm/@tarekraafat/autocomplete.js@10.2.7/dist/css/autoComplete.01.min.css`,
                                        `${opts.plugins_root_url}/_common/components/advancedTable.component.js`
				],
				() => {
					updateContent(genHtmlAndStyle())
                                        startMainLogic()
				}
			);
		}, 100)
                
        })
        return div
}
// 

window.initCustomTag = smartlistApp

