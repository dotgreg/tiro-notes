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
                each(configArray, (el, i) => {
                        // searchWord(el.searchTag, el.path, content => {
                                //         wrapperEl.innerHTML += `
                                //         <h3> ${el.category} </h3>
                                //         <div> ${JSON.stringify(content)} </div>
                                // `  })
                        })
                        
                const wrapperEl = document.getElementById("smart-list-ctag-inner")
                // wrapperEl.innerHTML = window._tiroPluginsCommon.genAdvancedTableComponent({woop:"wooooooooooop"})
                const config = {
                        cols: [
                                {colId: "icon", headerLabel: "-", type:"icon"},
                                {colId: "name", headerLabel: "Name"},
                                {colId: "actions", type: "buttons", buttons:[
                                        {
                                                label: "", 
                                                icon: "close", 
                                                onClick: (id) => {
                                                        console.log('Delete clicked for id:', id);
                                                }
                                        },
                                        {
                                                label: "", 
                                                icon: "image", 
                                                onClick: (id) => {
                                                        console.log('Delete clicked for id:', id);
                                                }
                                        }
                                ]},
                        ]
                };
                wrapperEl.innerHTML = window._tiroPluginsCommon.genTableComponent({items: [], config})


        }
    
        setTimeout(() => {
                setTimeout(() => {
                        api.utils.resizeIframe("100%");
                }, 100)
                setTimeout(() => {
			api.utils.loadRessources(
				[
                                        `${opts.plugins_root_url}/_common/components/advancedTable.component.js`,
                                        `${opts.plugins_root_url}/_common/components/table.component.js`
				],
				() => {
                                        startMainLogic()
				}
			);
		}, 100)
                
        })
        return `
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet"> 
        <div id="smart-list-ctag"> 
                <div id="smart-list-ctag-inner"> 
                
                </div>
                
        </div>

        <style>
                #smart-list-ctag {
                }
                      
        </style> `
}
// 

window.initCustomTag = smartlistApp

