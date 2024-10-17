const timelineApp = (innerTagStr, opts) => {
        
const helpStrTable = `
<h3>Timeline Component</h3>
<p>This is the Timeline component. It allows you to display a timeline of events in your document.</p>
<h4>Modes</h4>
<p>FILES mode: (default) You can either search words and display the files which contains them in the timeline</p>
<p>TAGS mode: you can search for lines in a folder. Each line will create a unique timeline event</p>

<h4>FILES mode</h4>
<p> To look for all files including #important_event in the folder /main/ : </p>
<pre><code>
[[timeline]]
#important_event | /main/
[[timeline]]

</code></pre>

<h4>TAGS mode</h4>
<p> the format of the line is the following : [timeline| my event | 30/11/22|365|formation]</p>
<p> which can be decomposed as follow: [timeline| title| start date| duration in days| event group]</p>

<p> To create a timeline event, you need to create a line in your document with the following format:</p>
<p> it will look for lines in the folder /main/ and /journal/ starting by the word "[event|"</p>
<pre><code>
[[timeline]]
mode:tag
[event| /main/
[event| /journal/
[[timeline]]

</code></pre>

`

        ///////////////////////////////////////////////////
        // 3.1 FILTER INPUT
        //
        const inputFilterHtml = `
        <style>

        #timeline-ctag #filter-graph-wrapper #filter-files-wrapper{
                display:none;
        }
        #timeline-ctag.mode-files #filter-graph-wrapper #filter-files-wrapper{
                display:block;
        }
        #timeline-ctag.is-mobile #filter-graph-wrapper{
                        opacity: 1;
        }
        #timeline-ctag:hover #filter-graph-wrapper{
                        opacity: 1;
        }
        #filter-graph-wrapper {
                        opacity: 0;
                        transition: all 0.2s;
        }


        #filter-graph-wrapper {
                        position: absolute;
                        right: 20px;
                        top: 10px;
                        z-index: 10;
        }
        #filter-graph::placeholder {
                        color:#a1a1a1;
        }
        #filter-graph {
                        color:#a1a1a1;
                        background: none;
                        border: none;
                        border-bottom: 1px solid #dddddd;
                        padding-bottom: 6px;
                        font-weight: 400;
                        font-size: 12px;
                        outline: none;
        }
        #filter-best-guess {
                        font-size: 10px;
                        color:#a1a1a1;
        }
        #filter-toggle-hover {

        }
        #filter-toggle-hover input {

        }
        </style>
        <div id="filter-graph-wrapper">
                <div id="filter-files-wrapper">
                        <input
                                type="text"
                                id="filter-graph"
                                placeholder="Type to filter"
                        />
                        <div id="filter-best-guess"></div>
                        <div id="filter-toggle-hover">
                                <input type="checkbox" id="filter-toggle" />
                                <label for="filter-toggle">Hover</label>
                        </div>
                </div>
                <div id="other-wrapper">
                        <button id="help-button" onclick="window.onHelpClick()">?</button>
                </div>
        </div>`

        window.onHelpClick = () => {
                api.call("popup.show", [helpStrTable, "Table Help"])
        }
        
        const normalizeStr = str => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

        
        // CACHING MECHANISM
        const cacheId = `ctag-timeline-${api.utils.getInfos().file.path}`
        const getCache = (onSuccess, onFailure, customCacheId) => {
                let cId = customCacheId ? cacheId + customCacheId : cacheId
                api.call("cache.get", [cId], content => {
                        if (content !== undefined) {
                                onSuccess(content)
                        }
                        else {
                                onFailure()
                        }
                })
        }
        const setCache = (content, customCacheId) => {
                let cId = customCacheId ? cacheId + customCacheId : cacheId
                api.call("cache.set", [cId, content, 10000000])
        }
        const initFilterInput = ( ) => {
                const filterWrapper = document.getElementById('filter-graph-wrapper');
                const filterInput = document.getElementById('filter-graph');
                const bestGuessEl = document.getElementById('filter-best-guess');

                // caching in LS filter
                const filterIdCache = "filter-cache"
                const fetchAndSearchFilterValue = () => {
                        getCache(initValueFilter => {
                                if (initValueFilter) {
                                        const filterInput = document.getElementById('filter-graph');
                                        filterInput.value = initValueFilter
                                        setTimeout(() => {
                                                let bypassEnter = true
                                                searchForWord({}, bypassEnter)
                                        }, 100)
                                }
                        }, () => {}, filterIdCache)
                }
                fetchAndSearchFilterValue()
                
                const searchForWord = (e, bypassEnter=false) => {
                        let isEnter = e && e.key === "Enter"
                        if (bypassEnter) isEnter = true
                        setCache(filterInput.value, filterIdCache)
                        const val = normalizeStr(filterInput.value)
                        if (!isEnter) return
                        // split val by comma
                        const valArr = val.split(",")
                        // for each valArr, push in array {wordToSearch, pathToSearch:"/"}
                        const configArr = valArr.map(v => ({wordToSearch: v.trim(), pathToSearch: "/"}))
                        searchAndRenderTimeline(configArr, "files")
                }
                filterInput && filterInput.addEventListener("keydown", searchForWord);
        }
        const hoverState = {enabled:false}
        const toggleHover = (e) => {
                hoverState.enabled = e.target.checked
        }
        const initHoverToggle = () => {
                const filterToggle = document.getElementById("filter-toggle")
                filterToggle && filterToggle.addEventListener("change", toggleHover)
        }
        
        
        













        
        
        
        const openFileInWindow = (itemClicked, itemsArr) => {
                
                if (!itemClicked) return
                // api.call("ui.notePreviewPopup.open", [itemClicked.filePath, ["50%" ,"50%"], { searchedString:itemClicked.itemRawStr}])
                api.call("ui.floatingPanel.openFile", [itemClicked.filePath, { searchedString:itemClicked.itemRawStr, idpanel: "id-panel-timeline-preview", layout:"bottom-right"}])
        }
        const timelineRender = (itemsArr, groupsNames) => {
                const wrapperEl = document.getElementById("timeline-ctag-inner")

                // delete everything inside wrapperEl
                while (wrapperEl.firstChild) {
                        wrapperEl.removeChild(wrapperEl.firstChild);
                }
                
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
                        let itemClicked = itemsArr.filter(el => el.id === properties.items[0])[0]
                        openFileInWindow(itemClicked, itemsArr)
                });
                timeline.on('itemover', function (properties) {
                        if (!hoverState.enabled) return
                        // activate the item
                        timeline.setSelection(properties.item)
                        let itemClicked = itemsArr.filter(el => el.id === properties.item)[0]
                        openFileInWindow(itemClicked, itemsArr)
                });
                        
        }

        const searchAndRenderTimeline = (configArr, currentMode) => {
                
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

                console.log("TIMELINE",configArr, "configArr", currentMode)

                if (currentMode === "files") {
                        groupsNames.push("files")
                        configArr.forEach(config => {
                                searchWord(config.wordToSearch, config.pathToSearch, searchRes => {
                                        console.log(searchRes, "searchRes", config.wordToSearch, config.pathToSearch)
                                        for (const [filePath, fileResult] of Object.entries(searchRes)) {
                                                // file.results.forEach(l => {
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
                                                        console.log(nItem, "nItem")
                                                        try {
                                                                if (!isPonctual) nItem.end = endDate.toISOString().split('T')[0]
                                                                itemsArr.push(nItem)
                                                        } catch (error) {
                                                                
                                                                console.log('ERROR with item', nItem, error)

                                                        }
                                                        
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

        const startMainLogic = () => {
                const api = window.api;

                //
                // config innerTagStr or default
                //
                // let wordToSearch = "[timeline"
                // let pathToSearch = api.utils.getInfos().file.folder
                // let configArr = [{wordToSearch: "[timeline", pathToSearch: api.utils.getInfos().file.folder}]
                let configArr = []
                let currentMode = "files"
                let innerTagArr = innerTagStr.split("\n")
                if (innerTagArr.length > 0) configArr.length = 0
                // if first line start by mode:
                if (innerTagArr[0].indexOf("mode:") > -1) {
                        currentMode = innerTagArr[0].split(":")[1].trim()
                        innerTagArr.shift()
                }

                for (let i = 0; i < innerTagArr.length; i++) {
                        const line = innerTagArr[i];
                        if (line.indexOf("|") > -1) {
                                wordToSearch = line.split("|")[0].trim()
                                pathToSearch = line.split("|")[1].trim()
                                configArr.push({wordToSearch, pathToSearch})
                        }
                }
                // if innerTagArr > 0, currentMode = tag
                if (innerTagArr.length > 0) currentMode = "tag"

                searchAndRenderTimeline(configArr, currentMode)
                //
                // Default config is like:
                // [timeline | /path/to/search
                // [timeline | /path/to/search2
                // [timeline | /path/to/search3
                // [timeline | /path/to/search4
                //
                // split innerTagStr per line

                

                if (currentMode === "files") {
                        initFilterInput()
                        initHoverToggle()
                        // add to #timeline-ctag the class mode-files
                        document.getElementById("timeline-ctag").classList.add("mode-files")
                }
                
                                
                
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
                ${inputFilterHtml}
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

