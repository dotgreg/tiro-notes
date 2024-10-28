// 10.10.2023 v1.1

const smartlistApp = (innerTagStr, opts) => {
        const { div, updateContent } = api.utils.createDiv()

        const outputPaths = {}
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
                if (configArray.length === 0) configArray = [{}]
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
                if (configArray[0].tag1) document.getElementById("smart-list-ctag-search").value = configArray[0].tag1
                if (configArray[0].tag1) localStorage.setItem("smartlist-ctag-tag1", configArray[0].tag1)
                if (configArray[0].path) document.getElementById("smart-list-ctag-path").value = configArray[0].path
                if (configArray[0].path) localStorage.setItem("smartlist-ctag-path", configArray[0].path)

                // save configArray[0].tag1 and configArray[0].path to localStorage
                // localStorage.setItem("smartlist-ctag-tag1", configArray[0].tag1)
                // localStorage.setItem("smartlist-ctag-path", configArray[0].path)


                wrapperEl.innerHTML = "Loading..."
                const api = window.api;
                // wrapperEl.innerHTML = window._tiroPluginsCommon.genTableComponent({ items:[], config:{}, id: `smartlist-table-${api.utils.getInfos().file.path}` })

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

                let configMetaCols = true
                let hideConfigRows = false
                let colsToHide = []
                each(configArray, (el, i) => {
                        searchWord(el.tag1, el.path, listFilesRes => {

                                // FIRST LOOP TO CHECK FOR RULES
                                each(listFilesRes, (fileRes) => {
                                        each(fileRes.results, result => {
                                                // __config_hideCol_NAMECOL | another thing
                                                if (result.includes("__config_hideCol_")) {
                                                        // using regex, ends colName by either space or / or nothing, can have several results
                                                        // let colNames = result.match(/__config_hideCol_.*?[\s|\/|$]/g) 
                                                        let colNamesRaw = result.split(" ")
                                                        // only keep words starting by __config_hideCol_
                                                        let colNames = colNamesRaw.filter(col => col.startsWith("__config_hideCol_"))
                                                        // remove __config_hideCol_ from each colName
                                                        colNames = colNames.map(col => col.replace("__config_hideCol_", ""))
                                                        each(colNames, (colName) => {
                                                                colName = colName.replace("__config_hideCol_", "").trim()
                                                                colName = colName.toLowerCase()
                                                                colsToHide.push(colName)
                                                        })
                                                }
                                        })
                                })


                                // if we find the string config_no_extra_cols, remove all extra cols
                                if (JSON.stringify(listFilesRes).includes("__config_hide_meta")) configMetaCols = false
                                if (JSON.stringify(listFilesRes).includes("__config_hide_config_rows")) hideConfigRows = true
                                each(listFilesRes, (fileRes) => {
                                        let file = fileRes.file
                                        each(fileRes.results, result => {
                                                let finalObj = { filename: file.name, folder: file.folder, line: result } 
                                                if (result.indexOf("|") > -1) {
                                                        let [...cols] = result.split("|")
                                                        let i = 0
                                                        each(cols, (col) => {
                                                                i++
                                                                col = col.trim()
                                                                // if col is in colsToHide, do not add it to the finalObj
                                                                finalObj[`col${i}`] = col.trim()
                                                                if (customColLength < i) customColLength = i
                                                                // if starts by __header_ 
                                                                if (col.startsWith("__header_")) customColsNames[`col${i}`] = col.split("__header_")[1]
                                                        })
                                                }
                                                let created = new Date(file.created).toISOString().split("T")[0]
                                                if (configMetaCols) finalObj.created = created
                                                let isHeaderOrConfigRow = result.includes("__header_") || result.includes("__config_")
                                                let canPush = true
                                                if (hideConfigRows && isHeaderOrConfigRow) canPush = false
                                                canPush && items.push(finalObj)
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

                                loadTable({configMetaCols})
                        })
                })
                const exportDataToCsv = (els, p) => {
                        if (!p) p = {}
                        if (!p.colsToBlacklist) p.colsToBlacklist = ["filename", "folder", "created", "line", "actions"] 
                        // transform els in csv
                        let csvString = ""
                        // header       
                        let header = ""
                        let colsToShow = []
                        let i = 0
                        csvString += header + "\n"
                        // from els arr of objs, get all methods keys name
                        let allMethods = []
                        each(els, (el) => {
                                each(el, (val, key) => {
                                        if (!allMethods.includes(key)) allMethods.push(key)
                                })
                        })
                        colsToShow = allMethods.filter(method => !p.colsToBlacklist.includes(method))
                        // first line of csv is the header
                        let headerLine = ""
                        each(colsToShow, (col) => {
                                headerLine += `${col},`
                        })
                        csvString += headerLine + "\n"
                        each(els, (el, i) => {
                                let line = ""
                                let lineIncludesHeader = false
                                let j = 0
                                // get all cols name
                                each(colsToShow, (col) => {
                                        let val = el[col]
                                        if (!val) val = " "
                                        if (val.startsWith("__header_")) lineIncludesHeader = true
                                        // if there are , in val, wrap it in ""
                                        // if (val.indexOf(",") > -1) val = `"${val}"`
                                        val = val.replaceAll(",", "__COMMA_CHAR__")
                                        // if content is a date, transform it to 2017-06-01
                                        // if there is 2 / in val, it is a date
                                        if (val.split("/").length === 3) {
                                                let [day, month, year] = val.split("/")
                                                val = `${month}-${day}-${year}`
                                        }
                                        let separator = j === Object.keys(el).length - 1 ? "" : ","
                                        line += `${val}${separator}`
                                        j++;
                                })
                                // do not include header lines in the graph export
                                if (!lineIncludesHeader) csvString += line + "\n"
                        })
                        return csvString        
                }

                const loadTable = (p) => {
                        if (!p) p = {}
                        // wrapperEl.innerHTML = window._tiroPluginsCommon.genAdvancedTableComponent({woop:"wooooooooooop"})
                        const config = {
                                id: `smartlist-table-${configArray.length}-${configArray[0]?.tag1}-${configArray[0]?.path}`,
                                cols: [],
                                gridView: false,
                                exportToCsv: els => {
                                        // 
                                        let csvString = exportDataToCsv(els, {colsToBlacklist: []})
                                        // create a html button and trigger it in js to download the csv as blob file
                                        const blob = new Blob([csvString], { type: 'text/csv' });
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.setAttribute('hidden', '');
                                        a.setAttribute('href', url);
                                        // name is "export-10-10-2023--10h23.csv"
                                        let name = `export-${new Date().toISOString().split("T")[0]}--${new Date().toISOString().split("T")[1].split(":").slice(0, 2).join("h")}.csv`
                                        a.setAttribute('download', name);
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                },
                                exportToGraph: els => {
                                        let csvString = exportDataToCsv(els)
                                        console.log('csvString:', csvString, els)
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
                                config.cols.push({ colId: `col${i}`, headerLabel: `Col${i}` })
                        }
                        for (const key in customColsNames) {
                                config.cols.push({ colId: customColsNames[key], headerLabel: customColsNames[key] })

                                // remove key(like col1) from config.cols
                                config.cols = config.cols.filter(col => col.colId !== key)
                        }
                        // if colsToHide, remove them
                        for (const col of colsToHide) {
                                config.cols = config.cols.filter(c => c.colId !== col)
                        }

                        // if (hasTag2) config.cols.push({colId: "tag2", headerLabel: "Tag2", classes:"td-tag"})
                        // if (hasTag3) config.cols.push({colId: "tag3", headerLabel: "Tag3", classes:"td-tag"})
                        // {colId: "filename", headerLabel: "Filename"},
                        // {colId: "folder", headerLabel: "Folder"},

                        const isMobile = () => {
                                let check = false;
                                //@ts-ignore
                                (function(a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
                                return check;
                        };
                        p.configMetaCols && config.cols.push({ colId: "filename", headerLabel: "Filename" })
                        p.configMetaCols && config.cols.push({ colId: "created", headerLabel: "Created" })
                        p.configMetaCols && config.cols.push({ colId: "folder", headerLabel: "Folder" })
                        p.configMetaCols && config.cols.push({ colId: "line", headerLabel: "Line" })
                        config.cols.push({
                                colId: "actions", type: "buttons", buttons: [
                                        {
                                                label: "",
                                                icon: "eye",
                                                onClick: (items, e) => {
                                                        console.log('onClick:', items, e)
                                                        if (items.length !== 1) return console.warn("no item selected")
                                                        let item = items[0]
                                                        console.log('onClick:', item, e);
                                                        let filePath = item.folder + item.filename
                                                        // api.call("ui.notePreviewPopup.open", [filePath, ["50%", "50%"], { searchedString: item.line, replacementString: `wooop` }])
                                                        let layout = isMobile() ? "top" : "top-right"
                                                        api.call("ui.floatingPanel.openFile", [filePath, { 
                                                                searchedString:item.line, 
                                                                idpanel: "id-panel-smartlist-preview", 
                                                                view: "editor",
                                                                layout
                                                        }])

                                                },
                                                onMouseEnter: (item, e) => {
                                                        // console.log('onMouseEnter:', item,e);
                                                },
                                                onMouseLeave: (item, e) => {
                                                        // console.log('onMouseLeave:', item,e);
                                                }
                                        },
                                ]
                        })

                        wrapperEl.innerHTML = window._tiroPluginsCommon.genTableComponent({ items, config, id: `smartlist-table-${api.utils.getInfos().file.path}` })
                }
        }

        const preloadPreact = () => {
                api.utils.loadRessourcesOneByOne([
                        "https://cdnjs.cloudflare.com/ajax/libs/preact/10.24.3/preact.min.umd.min.js",
                        "https://cdnjs.cloudflare.com/ajax/libs/preact/10.24.3/hooks.umd.min.js",
                ])
        }
        preloadPreact()
        setTimeout(() => {
                setTimeout(() => {
                        api.utils.resizeIframe("100%");
                }, 100)
                setTimeout(() => {
                        api.utils.loadRessources(
                                [
                                        `${opts.plugins_root_url}/_common/components/table.component.js`
                                ],
                                () => {
                                        // alert("woopeeee333443333!");
                                        const configArray = readConfigString(innerTagStr)
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
                #smart-list-ctag {
                        min-width: 660px;
                        position: relative;
                }

                .table-buttons-wrapper {
                        position: absolute;
                        right: 12px;
                        top: 15px;
                }
                
                // @media screen and (max-width: 700px) {
                //         .table-buttons-wrapper {
                //                 position: inherit;
                //                 margin: 20px 20px 0px 20px;
                //         }
                // }
                .table-buttons-wrapper input {
                        margin-right: 10px;
                        background-color: #fff;
                        border: none;
                        box-shadow: 0 0 0 1px #ccc;
                        border-radius: 3px;
                        padding: 4px;
                        width: 100px;
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

