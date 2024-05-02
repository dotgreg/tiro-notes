const timelineApp = (innerTagStr, opts) => {
        const openFileInWindow = (properties, itemsArr) => {
                let itemClicked = itemsArr.filter(el => el.id === properties.items[0])[0]
                if (!itemClicked) return
                // api.call("ui.notePreviewPopup.open", [itemClicked.filePath, ["50%" ,"50%"], { searchedString:itemClicked.itemRawStr}])
                api.call("ui.floatingPanel.openFile", [itemClicked.filePath, { searchedString:itemClicked.itemRawStr, idpanel: "id-panel-timeline-preview"}])
        }
        const timelineRender = (itemsArr, groupsNames) => {
                console.log("timelineRender", itemsArr, groupsNames)
                const wrapperEl = document.getElementById("timeline-ctag-inner")
                
                // 
                // GROUPS
                //
                var groups = new vis.DataSet();
                for (var g = 0; g < groupsNames.length; g++) {
                        groups.add({ id: g, content: groupsNames[g] });
                }

                // 
                // ITEMS
                //
                var items = new vis.DataSet(itemsArr)

                // Configuration for the Timeline
                var options = {
                        template: function (item, element, data) {
                                return `<div class="content-wrapper-overflow"> ${data.content}</div> `;
                        },
                        height: 'calc(100% - 30px)',
                };
                // Create a Timeline
                var timeline = new vis.Timeline(wrapperEl, items, options);
                timeline.setGroups(groups);

                // timeline 6 months period by default
                var start = new Date();
                var end = new Date();
                start.setMonth(start.getMonth() - 5);
                end.setMonth(end.getMonth() + 2);
                timeline.setWindow(start, end);

                timeline.on('select', function (properties) {
                        openFileInWindow(properties, itemsArr)
                });
                timeline.on('hover', function (properties) {
                        openFileInWindow(properties, itemsArr)
                });
                        
        }

        const startMainLogic = () => {
                const api = window.api;
                

                //
                // config innerTagStr or default
                //
                // let wordToSearch = "[timeline"
                // let pathToSearch = api.utils.getInfos().file.folder
                let configArr = [{wordToSearch: "[timeline", pathToSearch: api.utils.getInfos().file.folder}]

                //
                // Default config is like:
                // [timeline | /path/to/search
                // [timeline | /path/to/search2
                // [timeline | /path/to/search3
                // [timeline | /path/to/search4
                //
                // split innerTagStr per line

                let currentMode = "files"
                let innerTarArr = innerTagStr.split("\n")
                if (innerTarArr.length > 0) configArr.length = 0
                // if first line start by mode:
                if (innerTarArr[0].indexOf("mode:") > -1) {
                        currentMode = innerTarArr[0].split(":")[1].trim()
                        innerTarArr.shift()
                }

                for (let i = 0; i < innerTarArr.length; i++) {
                        const line = innerTarArr[i];
                        if (line.indexOf("|") > -1) {
                                wordToSearch = line.split("|")[0].trim()
                                pathToSearch = line.split("|")[1].trim()
                                configArr.push({wordToSearch, pathToSearch})
                        }
                }
                console.log("configArr", configArr, "mode", currentMode)
                //
                // search for tags
                //
                const searchWord = (word, path, cb) => {
                        api.call("search.word", [word, path], content => {
                                        cb(content)
                        })
                }
                const itemsArr = []
                const groupsNames = []
                let id = 0
                let configCount = 0


                if (currentMode === "files") {
                        groupsNames.push("files")
                        configArr.forEach(config => {
                                searchWord(config.wordToSearch, config.pathToSearch, searchRes => {
                                        console.log(searchRes, "searchRes", config.wordToSearch, config.pathToSearch)
                                        for (const [filePath, fileResult] of Object.entries(searchRes)) {
                                                // console.log(fileResult)
                                                // console.log(fileResult.file.created)
                                                // file.results.forEach(l => {
                                                //         console.log(l)
                                                // })
                                                const startDate = new Date(fileResult.file.created)
                                                id++
                                                let content = fileResult.results[0]
                                                content = fileResult.file.name
                                                const nItem = {
                                                        id: id,
                                                        content ,
                                                        start: startDate.toISOString().split('T')[0],
                                                        group: 0,
                                                        filePath: fileResult.file.path,
                                                        className: "show-title-item",
                                                        itemRawStr: fileResult.results[0],
                                                }
                                                itemsArr.push(nItem)
                                        }
                                        configCount++
                                        if (configCount === configArr.length) {
                                                timelineRender(itemsArr, groupsNames)
                                        }
                                })
                        })
                }
                if (currentMode === "tag") {
                        configArr.forEach(config => {
                                searchWord(config.wordToSearch, config.pathToSearch, searchRes => {
                                        // res is an object
                                        for (const [filePath, file] of Object.entries(searchRes)) {
                                                file.results.forEach(l => {
                                                        //
                                                        // ITEM PROCESSING
                                                        //
                                                        // [timeline| goal| 30/11/22|365|formation]
                                                        // start at wordToSearch
                                                        let itemRawStr = l.split(config.wordToSearch)[1]
                                                        let itemRawArr = itemRawStr.split("|").filter(el => el)
                                                        // keep only the first 4 elements
                                                        if (itemRawArr.length < 4) return console.warn(`timeline: line ${l} is not valid`, itemRawArr)
                                                        // the 4th one shoudl end with ]
                                                        if (itemRawArr[3].indexOf("]") === -1) return console.warn(`timeline: line ${l} is not valid`, itemRawArr)
                                                        itemRawArr[3] = itemRawArr[3].split("]")[0].trim()
                                                        
                                                        //
                                                        // DATE PROCESSING
                                                        //
                                                        // function that take a date string in french format like 23/11/23 and output a date object
                                                        startDateStr = itemRawArr[1].trim()
                                                        durationDaysStr = itemRawArr[2].trim()
                                                        const dateStrToObj = (dateStr) => {
                                                                let dateParts = dateStr.split('/')
                                                                let day = dateParts[0]
                                                                let month = dateParts[1]
                                                                let year = dateParts[2]
                                                                return new Date(`${month}/${day}/${year}`)
                                                        }

                                                        let startDate = dateStrToObj(startDateStr);
                                                        if (startDateStr === '?') {
                                                                startDate = new Date(); // If '?' is specified, use today's date
                                                        }
                                                        let endDate = new Date(startDate.getTime());
                                                        if (durationDaysStr.includes('?')) {
                                                                endDate = new Date(); // If '?' is specified, use today's date
                                                        } else {
                                                                let durationDays = parseInt(durationDaysStr, 10);
                                                                endDate.setDate(endDate.getDate() + durationDays);
                                                        }

                                                        // keep groupsNames unique values only
                                                        let group = itemRawArr[3]
                                                        if (!groupsNames.includes(group)) groupsNames.push(group)
                                                        const groupIndex = groupsNames.indexOf(group)
                                                        let isPonctual = durationDaysStr === "1"
                                                        id++
                                                        const nItem = {
                                                                id: id,
                                                                content: itemRawArr[0],
                                                                start: startDate.toISOString().split('T')[0],
                                                                group: groupIndex,
                                                                filePath: file.file.path,
                                                                className: "show-title-item",
                                                                itemRawStr: itemRawStr,
                                                        }
                                                        if (!isPonctual) nItem.end = endDate.toISOString().split('T')[0]
                                                        itemsArr.push(nItem)
                                                        
                                                })
                                        }
                                        configCount++
                                        if (configCount === configArr.length) {
                                                timelineRender(itemsArr, groupsNames)
                                        }
                                })
                        })
                } // end if currentMode === "tag"

                                
                
        }
    
        setTimeout(() => {
                setTimeout(() => {
                        api.utils.resizeIframe("100%");
                }, 100)
                setTimeout(() => {
			api.utils.loadRessources(
				[
                                        `https://visjs.github.io/vis-timeline/standalone/umd/vis-timeline-graph2d.min.js`
				],
				() => {
                                        startMainLogic()
				}
			);
		}, 100)
                
        })
        return `
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet"> 
        <div id="timeline-ctag"> 
                <div id="timeline-ctag-inner"> 
                
                </div>
                
        </div>

        <style>
                body, html, .simple-css-wrapper, #content-wrapper, #content-wrapper>div,   #timeline-ctag, #timeline-ctag-inner {
                        margin: 0;
                        padding: 0;
                        height: 100%;
                        overflow: hidden;
                }
                #timeline-ctag { }
                #timeline-ctag table { 
                        min-width: 660px;
                }
                #timeline-ctag .td-tag { 
                }
                #timeline-ctag .td-tag .cell-content {  
                        max-width: 50px;
                        overflow: hidden;
                        // word-break: break-all;
                }
                #timeline-ctag .vis-range.show-title-item .vis-item-overflow {
                        overflow: visible!important;
                }
                #timeline-ctag .vis-range.show-title-item .vis-item-content>div {
                        position: absolute;
                        min-width: 200px;
                        top: -4px;
                }
                    
                      
        </style> `
}
// 

window.initCustomTag = timelineApp

