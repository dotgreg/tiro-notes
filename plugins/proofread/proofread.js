const proofreadApp = (innerTagStr, opts) => {
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
                const wrapperEl = document.getElementById("proofread-ctag-inner")
                wrapperEl.innerHTML = "Proofreading text..."

                const api = window.api;

                console.log("proofreadApp", innerTagStr, opts)

                let textToProofread = innerTagStr.replaceAll("\n", ".")

                const optionsReq = {
                    method:"POST", 
                    body:[["language","auto"], ["text",textToProofread]], 
                    disableCache:true
                }
                const proofReadApi = cb => {
                    api.call("ressource.fetch", [
                        "https://api.languagetool.org/v2/check", 
                        optionsReq
                    ], result => {
                        cb(JSON.parse(result))
                    })
                }
                

                proofReadApi(result => {
                    // console.log("proofReadApi", result)
                    let items = []
                    //
                    // JSON TO ITEMS
                    //
                    each(result.matches, match => {
                        let replacements = []
                        each(match.replacements, replacement => {
                            replacements.push(replacement.value)
                        })
                        // only keep 5 replacements
                        replacements = replacements.slice(0, 5)

                        // remove ... in context
                        // let context = match.context.text.replaceAll("...", "")
                        const context = match.context.text
                        let contextRaw = context.replaceAll("...", "")

                        // context = context.replaceAll(match.context.offset, `<span class="highlight">${match.context.offset}</span>`)
                        // wrap context in span using context.offset and context.length
                        let contextStr = context.substring(0, match.context.offset) + `<span class="highlight">${context.substring(match.context.offset, match.context.offset + match.context.length)}</span>` + context.substring(match.context.offset + match.context.length)
                        let contextWithFirstReplacement = context.substring(0, match.context.offset) + replacements[0] + context.substring(match.context.offset + match.context.length)

                        items.push({ 
                            message: match.message, 
                            replacements: replacements.join(", "), 
                            replacementsArr: replacements,
                            offset: match.offset, 
                            length: match.length, 
                            contextWithFirstReplacement,
                            contextRaw,
                            contextStr, 
                            rule: match.rule.id, 
                            ruleDescription: match.rule.description
                        })
                    })

                    //
                    // GENERATION TABLE
                    //
                    filePath = api.utils.getInfos().file.path
                    // console.log("items", items, result, api.utils.getInfos())
                    
                    const config = {
                            cols: [
                                    {colId: "contextStr", headerLabel: "context"},
                                    {colId: "replacements", headerLabel: "replacements"},
                                   
                                    {colId: "actions", type: "buttons", buttons:[
                                        {
                                            label: "", 
                                            icon: "pen", 
                                            onClick: (items,e) => {
                                                // console.log('onClick:', items,e, filePath)
                                                if (items.length !== 1) return console.warn("no item selected")
                                                let item = items[0]
                                                // console.log('onClick:', {item, filePath, file: api.utils.getInfos().file});
                                                let pos = ["50%" ,"50%"]
                                                let searchedString = item.contextRaw.split(".")[0].trim()
                                                // let replacementString = item.contextWithFirstReplacement
                                                api.call("ui.notePreviewPopup.open", [filePath, pos, { searchedString}])
                                        
                                            },
                                            onMouseEnter: (item,e) => {
                                                // console.log('onMouseEnter:', item,e);
                                            },
                                            onMouseLeave: (item,e) => {
                                                // console.log('onMouseLeave:', item,e);
                                            }
                                        },
                                    ]
                                },
                                {colId: "message", headerLabel: "message"},
                            ]
                    };
                    wrapperEl.innerHTML = window._tiroPluginsCommon.genTableComponent({items, config, id:`proofread-table-${api.utils.getInfos().file.path}`})


                })

                // if (hasTag2) config.cols.push({colId: "tag2", headerLabel: "Tag2", classes:"td-tag"})
                // if (hasTag3) config.cols.push({colId: "tag3", headerLabel: "Tag3", classes:"td-tag"})
                // // {colId: "filename", headerLabel: "Filename"},
                // // {colId: "folder", headerLabel: "Folder"},
                // config.cols.push({colId: "filename", headerLabel: "Filename"})
                // config.cols.push({colId: "folder", headerLabel: "Folder"})
                // config.cols.push({colId: "actions", type: "buttons", buttons:[
                //         {
                //           label: "", 
                //           icon: "eye", 
                //           onClick: (items,e) => {
                //                 console.log('onClick:', items,e)
                //                 if (items.length !== 1) return console.warn("no item selected")
                //                 let item = items[0]
                //                 console.log('onClick:', item,e);
                //                 let pos = ["50%" ,"50%"]
                //                 filePath = item.folder + item.filename
                //                 api.call("ui.notePreviewPopup.open", [filePath, pos, { searchedString:item.line, replacementString:`wooop`}])
                        
                //           },
                //           onMouseEnter: (item,e) => {
                //                 // console.log('onMouseEnter:', item,e);
                //           },
                //           onMouseLeave: (item,e) => {
                //                 // console.log('onMouseLeave:', item,e);
                //           }
                //         },
                // ]})

                


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
        <div id="proofread-ctag"> 
                <div id="proofread-ctag-inner"> 
                
                </div>
                
        </div>

        <style>
                #proofread-ctag { }
                #proofread-ctag table { 
                        min-width: 660px;
                }
                #proofread-ctag .td-tag { 
                }
                #proofread-ctag .td-tag .cell-content {  
                        max-width: 50px;
                        overflow: hidden;
                        // word-break: break-all;
                }
                #proofread-ctag .highlight { 
                        background-color: yellow;
                }
                      
        </style> `
}
// 

window.initCustomTag = proofreadApp

