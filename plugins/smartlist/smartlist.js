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
                let hasTag2 = false
                let hasTag3 = false
                innerTagStr.split("\n").forEach((el, i) => {
                        if (el.indexOf("|") > -1) {
                                arr = el.split("|")
                                let [category, path, tag1, tag2, tag3] = el.split("|")
                                category = category.trim()
                                path = path.trim()
                                tag1 = tag1.trim()
                                if (tag2){ tag2 = tag2.trim() || null; hasTag2 = true }
                                if (tag3) {tag3 = tag3.trim() || null; hasTag3 = true}
                                if (!category || !path || !tag1) return console.warn(`smartlist: line ${i} is not valid`)
                                configArray.push({ category, path, tag1, tag2, tag3 })
                        }
                })
                // document.getElementById("smart-list-ctag").innerHTML = JSON.stringify(configArray)
                // for each config, create a div with a title and a list
                let items = []
                each(configArray, (el, i) => {
                        searchWord(el.tag1, el.path, listFilesRes => {
                                each(listFilesRes, (fileRes) => {
                                        let file = fileRes.file
                                        each(fileRes.results, result => {
                                                let words = result.split(" ")
                                                // if word start by either tag1, 2 or 3, add tag1,2,3 to the object
                                                let [tag1, tag2, tag3] = [null, null, null]
                                                each(words, word => {
                                                        if (word.startsWith(el.tag1)) tag1 = word
                                                        if (word.startsWith(el.tag2)) tag2 = word
                                                        if (word.startsWith(el.tag3)) tag3 = word
                                                })
                                                                
                                                items.push({ filename: file.name, folder: file.folder, line:result, tag1, tag2, tag3 })
                                        })
                                })
                        })
                })
                        
                const wrapperEl = document.getElementById("smart-list-ctag-inner")
                // wrapperEl.innerHTML = window._tiroPluginsCommon.genAdvancedTableComponent({woop:"wooooooooooop"})
                const config = {
                        cols: [
                                {colId: "line", headerLabel: "Line"},
                                {colId: "tag1", headerLabel: "Tag1", classes:"td-tag"},
                               
                        ]
                };
                if (hasTag2) config.cols.push({colId: "tag2", headerLabel: "Tag2", classes:"td-tag"})
                if (hasTag3) config.cols.push({colId: "tag3", headerLabel: "Tag3", classes:"td-tag"})
                // {colId: "filename", headerLabel: "Filename"},
                // {colId: "folder", headerLabel: "Folder"},
                config.cols.push({colId: "filename", headerLabel: "Filename"})
                config.cols.push({colId: "folder", headerLabel: "Folder"})
                config.cols.push({colId: "actions", type: "buttons", buttons:[
                        {
                          label: "", 
                          icon: "eye", 
                          onClick: (item,e) => {
                                console.log('onClick:', item,e);
                                // get mouse position [x,y] from event e
                                // let pos = [e.clientX, e.clientY]
                                let pos = ["50%" ,"50%"]
                                // console.log("pos", pos)
                                // console.log(api.utils.getInfos())
                                
                                filePath = item.folder + item.filename
                                api.call("ui.notePreviewPopup.open", [filePath, pos, { searchedString:item.line}])
                        
                          },
                          onMouseEnter: (item,e) => {
                                // console.log('onMouseEnter:', item,e);
                          },
                          onMouseLeave: (item,e) => {
                                // console.log('onMouseLeave:', item,e);
                          }
                        },
                ]})

                
                wrapperEl.innerHTML = window._tiroPluginsCommon.genTableComponent({items, config, id:`smartlist-table-${api.utils.getInfos().file.path}`})


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
                #smart-list-ctag { }
                #smart-list-ctag .td-tag { 
                }
                #smart-list-ctag .td-tag .cell-content {  
                        max-width: 50px;
                        overflow: hidden;
                        word-break: break-all;
                }
                      
        </style> `
}
// 

window.initCustomTag = smartlistApp

