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
        const readConfigString = () => {
                // split EDF TODO | # | /etc/blabla
                // INVEST | # | /etc/blabla in a config array of objects with category, searchTag and path
                let configArray = []
                let hasTag2 = false
                let hasTag3 = false
                innerTagStr.split("\n").forEach((el, i) => {
                        // if (el.indexOf("|") > -1) {
                        //         arr = el.split("|")
                        //         let [category, path, tag1, tag2, tag3] = el.split("|")
                        //         category = category?.trim()
                        //         path = path?.trim()
                        //         tag1 = tag1?.trim()
                        //         if (tag2){ tag2 = tag2?.trim() || null; hasTag2 = true }
                        //         if (tag3) {tag3 = tag3?.trim() || null; hasTag3 = true}
                        //         if (!category || !path || !tag1) return console.warn(`smartlist: line ${i} is not valid`)
                        //         configArray.push({ category, path, tag1, tag2, tag3 })
                        // }
                        // looks like #STRINGTOSEARCH | /path/to/search
                        if (el.indexOf("|") > -1) {
                                let [tag1, path] = el.split("|")
                                tag1 = tag1?.trim()
                                path = path?.trim()
                                if (!tag1 || !path) return console.warn(`smartlist: line ${i} is not valid`)
                                configArray.push({ tag1, path })
                        }
                })
                // return {terms, paths}
                // console.log('configArray:', configArray, innerTagStr)
                // if configArr length is 0
                if (configArray.length === 0)configArray  = [{}]
                return configArray
        }
        
        const triggerSearchFromInput = (configArray) => {
                const searchInput = document.getElementById("smart-list-ctag-search")
                const pathInput = document.getElementById("smart-list-ctag-path")
                const term = searchInput.value
                const path = pathInput.value
                configArray[0].tag1 = term
                configArray[0].path = path
                searchAndDisplay(configArray)
        }
        const listenToInputChanges = (configArray) => {
                // if input term or path changes, update the configArray and trigger rerender
                const searchInput = document.getElementById("smart-list-ctag-search")
                const pathInput = document.getElementById("smart-list-ctag-path")
                // if button pressed

                // restore last search term and path from localStorage
                const lastTag1 = localStorage.getItem("smartlist-ctag-tag1")
                const lastPath = localStorage.getItem("smartlist-ctag-path")
                if (lastTag1 && lastTag1 !== 'undefined') searchInput.value = lastTag1
                if (lastPath && lastTag1 !== 'undefined') pathInput.value = lastPath

                const searchBtn = document.getElementById("smart-list-ctag-search-btn")
                searchBtn.addEventListener("click", e => {
                        triggerSearchFromInput(configArray)
                })
                // if enter pressed on search input or path input
                searchInput.addEventListener("keyup", e => {
                        if (e.key === "Enter") triggerSearchFromInput(configArray)
                })
                pathInput.addEventListener("keyup", e => {
                        if (e.key === "Enter") triggerSearchFromInput(configArray)
                })
        }

        const searchAndDisplay = (configArray) => {
                const wrapperEl = document.getElementById("smart-list-ctag-inner")
                // update inputs with the first configArray
                // console.log('configArray:', configArray[0])
                if(configArray[0].tag1) document.getElementById("smart-list-ctag-search").value = configArray[0].tag1
                if(configArray[0].tag1) localStorage.setItem("smartlist-ctag-tag1", configArray[0].tag1)
                if(configArray[0].path) document.getElementById("smart-list-ctag-path").value = configArray[0].path
                if(configArray[0].path) localStorage.setItem("smartlist-ctag-path", configArray[0].path)
                
                // save configArray[0].tag1 and configArray[0].path to localStorage
                // localStorage.setItem("smartlist-ctag-tag1", configArray[0].tag1)
                // localStorage.setItem("smartlist-ctag-path", configArray[0].path)


                wrapperEl.innerHTML = "Loading..."
                const api = window.api;
                
                const searchWord = (word, path, cb) => {
                        api.call("search.word", [word, path], content => {
                                cb(content)
                        })
                }

                
                // document.getElementById("smart-list-ctag").innerHTML = JSON.stringify(configArray)
                // for each config, create a div with a title and a list
                let items = []
                let customColLength = 0
                let customColsNames = {}

                each(configArray, (el, i) => {
                        searchWord(el.tag1, el.path, listFilesRes => {

                                each(listFilesRes, (fileRes) => {
                                        let file = fileRes.file
                                        each(fileRes.results, result => {
                                                

                                                // let words = result.split(" ")
                                                // if word start by either tag1, 2 or 3, add tag1,2,3 to the object
                                                // let [tag1, tag2, tag3] = [null, null, null]
                                                // each(words, word => {
                                                //         if (word.startsWith(el.tag1)) tag1 = word
                                                //         if (word.startsWith(el.tag2)) tag2 = word
                                                //         if (word.startsWith(el.tag3)) tag3 = word
                                                // })
                                                // timestamp to 2017-06-01 12:00
                                                // if result has |, split it and add it to the object as col1, col2, col3 etc...
                                                let finalObj = { filename: file.name, folder: file.folder, line:result }
                                                if (result.indexOf("|") > -1) {
                                                        let [...cols] = result.split("|")
                                                        let i = 0
                                                        each(cols, (col) => {
                                                                i++
                                                                col = col.trim()
                                                                finalObj[`col${i}`] = col.trim()
                                                                if (customColLength < i) customColLength = i
                                                                // if starts by header_ 
                                                                if (col.startsWith("header_")) customColsNames[`col${i}`] = col.split("header_")[1]
                                                        })
                                                }
                                                let created = new Date(file.created).toISOString().split("T")[0]
                                                finalObj.created = created
                                                items.push(finalObj)
                                        })
                                })
                                // for each method of customColsNames using forIn
                                for (const key in customColsNames) {
                                        const val = customColsNames[key]
                                        // replace all replace items[i][key] by items[i][customColsNames[key]] and delete items[i][key]
                                        each(items, (item) => {
                                                if (!item[key]) return
                                                item[val] = item[key]
                                                delete item[key]
                                        })
                                        
                                }
                                loadTable()
                        })
                })
                        
                const loadTable = () => {
                        // wrapperEl.innerHTML = window._tiroPluginsCommon.genAdvancedTableComponent({woop:"wooooooooooop"})
                        const config = {
                                cols: [
                                        {colId: "line", headerLabel: "Line"},
                                        // {colId: "tag1", headerLabel: "Tag1", classes:"td-tag"},
                                
                                ],
                                gridView: false,
                                exportToGraph: els => {
                                        // transform els in csv
                                        let csvString = ""
                                        // header
                                        let header = ""
                                        each(els[0], (val, key) => {
                                                header += `${key} , `
                                        })
                                        csvString += header + "\n"
                                        each(els, (el, i) => {
                                                let line = ""
                                                each(el, (val, key) => {
                                                        // if there is 2 / in val, it is a date
                                                        if (val.split("/").length === 3) {
                                                                let [day, month, year] = val.split("/")
                                                                val = `${month}-${day}-${year}` 
                                                        }
                                                        line += `${val} , `
                                                })
                                                csvString += line + "\n"
                                        })
                                        const configFloatingWindow = {
                                                type: "ctag",
                                                layout: "top",
                                                id: "smartlist-datatable",
                                                ctagConfig: {
                                                        tagName: "datatable",
                                                        content: `${csvString}`,
                                                },
                                        }
                                        api.call("ui.floatingPanel.create", [configFloatingWindow])
                                }
                        };
                        for (let i = 1; i <= customColLength; ++i) {
                                config.cols.push({colId: `col${i}`, headerLabel: `Col${i}`})
                        }
                        for (const key in customColsNames) {
                                config.cols.push({colId: customColsNames[key], headerLabel: customColsNames[key]})

                                // remove key from config.cols
                                config.cols = config.cols.filter(col => col.colId !== key)
                        }
                        // if (hasTag2) config.cols.push({colId: "tag2", headerLabel: "Tag2", classes:"td-tag"})
                        // if (hasTag3) config.cols.push({colId: "tag3", headerLabel: "Tag3", classes:"td-tag"})
                        // {colId: "filename", headerLabel: "Filename"},
                        // {colId: "folder", headerLabel: "Folder"},

                        config.cols.push({colId: "filename", headerLabel: "Filename"})
                        config.cols.push({colId: "created", headerLabel: "Created"})
                        config.cols.push({colId: "folder", headerLabel: "Folder"})
                        config.cols.push({colId: "actions", type: "buttons", buttons:[
                                {
                                label: "", 
                                icon: "eye", 
                                onClick: (items,e) => {
                                        console.log('onClick:', items,e)
                                        if (items.length !== 1) return console.warn("no item selected")
                                        let item = items[0]
                                        console.log('onClick:', item,e);
                                        let pos = ["50%" ,"50%"]
                                        filePath = item.folder + item.filename
                                        api.call("ui.notePreviewPopup.open", [filePath, ["50%" ,"50%"], { searchedString:item.line, replacementString:`wooop`}])
                                
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
                                        const configArray = readConfigString(innerTagStr)
                                        // console.log('configArr:', configArray)
                                        listenToInputChanges(configArray)
                                        if (configArray[0].tag1 && configArray[0].path) {
                                                searchAndDisplay(configArray)
                                        }
                                        else {
                                                triggerSearchFromInput(configArray)
                                        }
				}
			);
		}, 100)
                
        })
        return `
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet"> 
        <div id="smart-list-ctag"> 
                <div class="table-buttons-wrapper">
                        <input type="text" id="smart-list-ctag-search" placeholder="Search term"/>
                        <input type="text" id="smart-list-ctag-path" placeholder="Folder path"/>
                        <button id="smart-list-ctag-search-btn">🔍</button>
                </div>
                <div id="smart-list-ctag-inner"> 
                
                </div>
        </div>

        <style>
                .table-buttons-wrapper {
                        position: absolute;
                        right: 42px;
                        top: 15px;
                }
                
                @media screen and (max-width: 600px) {
                        .table-buttons-wrapper {
                                position: inherit;
                                margin: 20px 20px 0px 20px;
                        }
                }
                .table-buttons-wrapper input {
                        margin-right: 10px;
                        background-color: #fff;
                        border: none;
                        box-shadow: 0 0 0 1px #ccc;
                        border-radius: 3px;
                        padding: 4px;
                }
                #smart-list-ctag {
                        margin-top:0px;
                        margin-bottom:40px;
                 }
                #smart-list-ctag table { 
                        min-width: 660px;
                }
                #smart-list-ctag .td-tag { 
                }
                #smart-list-ctag .td-tag .cell-content {  
                        max-width: 50px;
                        overflow: hidden;
                        // word-break: break-all;
                }
                      
        </style> `
}
// 

window.initCustomTag = smartlistApp

