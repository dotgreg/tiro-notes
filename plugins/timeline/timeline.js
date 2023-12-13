const timelineApp = (innerTagStr, opts) => {

        const startMainLogic = () => {
                const api = window.api;
                const wrapperEl = document.getElementById("timeline-ctag-inner")

                //
                // config innerTagStr or default
                //
                let wordToSearch = "[timeline"
                let pathToSearch = api.utils.getInfos().file.folder
                if (innerTagStr.indexOf("|") > -1) {
                        wordToSearch = innerTagStr.split("|")[0].trim()
                        pathToSearch = innerTagStr.split("|")[1].trim()
                }

                //
                // search for tags
                //
                const searchWord = (word, path, cb) => {
                        api.call("search.word", [word, path], content => {
                                        cb(content)
                        })
                }
                searchWord(wordToSearch, pathToSearch, searchRes => {
                        console.log(searchRes)
                        const itemsArr = []
                        const groupsNames = []
                        let id = 0
                        // res is an object
                        for (const [fileName, file] of Object.entries(searchRes)) {
                                file.results.forEach(l => {
                                        //
                                        // ITEM PROCESSING
                                        //
                                        // [timeline| goal| 30/11/22|365|formation]
                                        // start at wordToSearch
                                        let itemRawStr = l.split(wordToSearch)[1]
                                        let itemRawArr = itemRawStr.split("|").filter(el => el)
                                        // keep only the first 4 elements
                                        if (itemRawArr.length < 4) return console.warn(`timeline: line ${l} is not valid`, itemRawArr)
                                        // the 4th one shoudl end with ]
                                        if (itemRawArr[3].indexOf("]") === -1) return console.warn(`timeline: line ${l} is not valid`, itemRawArr)
                                        itemRawArr[3] = itemRawArr[3].split("]")[0]
                                        
                                        //
                                        // DATE PROCESSING
                                        //
                                        // function that take a date string in french format like 23/11/23 and output a date object
                                        startDateStr = itemRawArr[1]
                                        durationDaysStr = itemRawArr[2]
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
                                        
                                        id++
                                        const nItem = {
                                                id: id,
                                                content: itemRawArr[0],
                                                start: startDate.toISOString().split('T')[0],
                                                end: endDate.toISOString().split('T')[0],
                                                group: groupIndex,
                                                className: "show-title-item"
                                        }
                                        itemsArr.push(nItem)
                                        
                                })
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
                                }
                              };

                        // Create a Timeline
                        var timeline = new vis.Timeline(wrapperEl, items, options);
                        timeline.setGroups(groups);
                })

                                
                
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
                #timeline-ctag .show-title-item .vis-item-overflow {
                        overflow: visible!important;
                }
                #timeline-ctag .show-title-item .vis-item-content>div {
                        position: absolute;
                        min-width: 200px;
                        top: -2px;
                }
                    
                      
        </style> `
}
// 

window.initCustomTag = timelineApp
