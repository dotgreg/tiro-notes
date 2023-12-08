const FilesTagApp = (innerTagStr, opts) => {
    if (!opts) opts = {}
    const api = window.api;

    const execReactApp = (str) => {
        // loading commons libs & plugins 
        
        const r = React;
        const c = React.createElement;
        const ressourceFolder = `${api.utils.getInfos().file.folder}`

        const App = () => {
            const [status, setStatus] = r.useState('')
            const [rescan, setRescan] = r.useState(0)
            const [ressourcesUsageList, setRessourcesUsageList] = r.useState([])
            
            //
            // FOLDER SCANS & NAVIGATION
            //
            const [currFolderPath, setCurrFolderPath] = r.useState(ressourceFolder)
            const [allFolders, setAllFolders] = r.useState([])
            r.useEffect(() => {
              api.call("ui.browser.folders.get", [], folder => {
                  if (!folder) return
                  let foldersPaths = ["--opened folders--"]
                  const recursFn = (f) => {
                    f.forEach(f => {
                      foldersPaths.push(f.path)
                      if (f.children) recursFn(f.children)
                    })
                  }
                  recursFn(folder.children)
                  setAllFolders(foldersPaths)
              })
              // api.call("folders.get", [["/"], {depth:-1}], res => {
              //     if (!res.folders[0]) return
              //     let foldersPaths = []
              //     const recursFn = (f) => {
              //       f.forEach(f => {
              //         foldersPaths.push(f.path)
              //         if (f.children) recursFn(f.children)
              //       })
              //     }
              //     recursFn(res.folders[0].children)
              //     setAllFolders(foldersPaths)
              // })
            },[])



            //
            // FILE UPLOAD
            //
            const notifId = "files-ctag-upload-notif"
            const handleFileChange = (event) => {
                const file = event.target.files[0];
                const apiParams = {
                    file,
                    folderPath: currFolderPath,
                }
                // setStatus("Uploading files...")
                // api.call("ui.notification.emit",[{content:,id:notifId, options:{hideAfter:-1}}])
                api.call("upload.uploadFile", [apiParams], res => {
                  // api.call("ui.notification.emit",[{content:"Upload Success",id:notifId, options:{hideAfter:5}}])
                  setRescan(rescan+1)
                })
            };

            const getIconFile = (fileType) => {
              let ft = fileType.toLowerCase()
		          if (["jpg", "jpeg", "gif", "png" ].includes(ft)) return "image"
		          else if (["pdf" ].includes(ft)) return "file-pdf"
		          else if (["doc", "docx", "odt" ].includes(ft)) return "file-word"
		          else if (["xls", "xlsx" , "xls" , "ods" ].includes(ft)) return "file-excel"
		          else if (["avi", "flv", "h264", "m4v", "mov", "mp4", "mpg", "mpeg", "rm", "swf", "vob", "wmv", "mkv" ].includes(ft)) return "file-video"
		          else if (["7z", "arj", "deb", "rar", "gz", "zip", "rpm", "pkg"].includes(ft)) return "file-zipper"
		          else if (["aif", "mp3", "cda", "mid", "mpa", "ogg", "wav", "wpl", "wma", "midi"].includes(ft)) return "file-audio"
		          else if (["ppt", "pptx", "odp", "key", "pps"].includes(ft)) return "file-powerpoint"
              else if (["epub"].includes(ft)) return "book"
              else return "file"
            }

            //
            // On Click, open file in new window
            //
            const getFullUrlItem = (item) => {
              const infs = api.utils.getInfos()
              return `${infs.backendUrl}/static/${item.raw.path}?token=${infs.loginToken}`
            }
            const onItemOpenClick = (item) => {
              // if Item.type is pdf, epub or image => open in new tab
              console.log("opening Item ", api.utils.getInfos(), item, getFullUrlItem(item))
              if (["pdf", "epub"].indexOf(item.type) !== -1) {
                // window.open(Item.raw.path, '_blank').focus();
                api.call("ui.floatingPanel.create", [{
                  type: "ctag",
                  layout: "full-center",
                  ctagConfig: {
                    tagName: item.type,
                    content: `${item.raw.path}`,
                  },
                }])
              } else if (["png", "jpg", "jpeg", "gif"].indexOf(item.type) !== -1) {
                api.call("ui.lightbox.open", [0, [item.raw.path]])
              } else {
                api.call("ui.floatingPanel.create", [{
                  type: "ctag",
                  layout: "full-center",
                  ctagConfig: {
                    tagName: "web",
                    content: `${getFullUrlItem(item)}`,
                  },
                }])
              }
            }

            



            //
            // FILES LIST
            //
            const [files, setFiles] = r.useState([])
            const [globStats, setGlobStats] = r.useState({size:0, nb:0})
            r.useEffect(() => {
              setStatus("Scanning...")
              api.call("ressource.scanFolder", [currFolderPath], res => {
                  let nFiles = []
                  res.files.map(f => {

                    let created = f.stats?.ctime
                    created = created.replaceAll("Z","").replaceAll("T","")
                    created = created.split(".")[0]
                    // created = created.replaceAll("-",".").replaceAll(":","")
                    created = created.split(":")
                    created.pop()
                    created = created.join("h")
                    
                    let nFile = {
                      id: f.path,
                      name: f.name,
                      icon: getIconFile(f.extension),
                      type: f.extension,
                      size: Math.round(f.stats?.size * 100 / (1000 * 1000 )) / 100,
                      created,
                      used: (ressourcesUsageList.indexOf(f.name) !== -1) ? "yes" : "no",
                      raw:f
                    }
                    let ngs = {...globStats}
                    ngs.size += nFile.size
                    ngs.nb += 1
                    nFiles.push(nFile)
                  })
                  
                  // setGlobStats(ngs)
                  setFiles(nFiles)
                  setStatus("")
              })
            },[rescan, currFolderPath, ressourcesUsageList])



            //
            // RESSOURCE USAGE CHECKER
            //
            //api.search.word(".resources/", "/projects/project1", res => {console.log(2, res)})
            
            const searchForRessourcesUsage = () => {
              let stringToSearch = "(.resources/"
              api.call("search.word", [stringToSearch, currFolderPath], res => {
                const lines = []
                // res is an object
                for (const [fileName, file] of Object.entries(res)) {
                  file.results.forEach(l => {
                    const processedLine = l.split(stringToSearch)[1].split(")")[0]
                    lines.push(processedLine)
                  })
                }

                // remove duplicates
                const lines2 = []
                lines.forEach(l => {
                  if (lines2.indexOf(l) === -1) lines2.push(l)
                })
                setRessourcesUsageList(lines2)
              })
            }

            r.useEffect(() => {
              searchForRessourcesUsage()
            },[currFolderPath])

            // r.useEffect(() => {
            //   files.forEach(f => {
            //     if (ressourcesUsageList.indexOf(f.name) !== -1) f.used = "yes"
            //   })
            //   setFiles([...files])
            // },[rescan, currFolderPath, ressourcesUsageList])








            //
            // Table component config
            //
            const config = {
              gridView: {
                onClick: (item) => {
                  console.log('Delete clicked for id:', item);
                  onItemOpenClick(item)
                },
                image: (item) => {
                  if (["png", "jpg", "jpeg", "gif"].indexOf(item.type) !== -1) {
                    return `${getFullUrlItem(item)}`
                  } else if (["pdf", "epub"].indexOf(item.type) !== -1) {
                    return {html:`<div class="icon"><i class="fas fa-${item.icon}"></i></div>`}
                  }
                },
                hideLabel: (item) => {
                  if (["png", "jpg", "jpeg", "gif"].indexOf(item.type) !== -1) return true
                  return false
                },
                label: (item) => {
                  return `${item.name}`
                },
                contentHover: (item) => {
                  return `${item.name}`
                }
              },
              cols: [
                {colId: "multiselect", headerLabel: "", type:"multiselect"},
                {colId: "icon", headerLabel: "-", type:"icon"},
                {colId: "name", headerLabel: "Name ({{count}} items)", onClick:(item) => {
                  console.log('Delete clicked for id:', item);
                  onItemOpenClick(item)
                }},
                {colId: "size", headerLabel: `Size ({{sumCol}} Mb)` },
                {colId: "type", headerLabel: "Type"},
                {colId: "used", headerLabel: "Used"},
                {colId: "created", headerLabel: "Date"},
                {colId: "actions", type: "buttons", buttons:[
                    {
                      label: "", 
                      icon: "close", 
                      onClick: (items) => {
                        api.call("popup.confirm", [`Do you want to delete ${items.length} file`], () => {
                          items.forEach(item => {
                            api.call("ressource.delete", [item.raw.path], res => {
                              console.log("ressource.delete", res, item)
                              setRescan(rescan+1)
                            })
                          })
                        })
                      } 
                    }
                ]},
              ]
            };

            TableComp = () => {
              return window._tiroPluginsCommon.TableComponentReact({items:files, config:config})
            }

            // if last char is /, remove it
            let currFolderPath2 = (currFolderPath.slice(-1) === "/") ? currFolderPath.slice(0, -1) : currFolderPath
            
            return (
                c('div', { className: "files-table-wrapper" }, [
                    // input list wrapper all folders path, when selecting one, it will rescan the folder
                    c('div', { className: "files-commands-wrapper" }, [
                      c('div', { className: "folders-list-wrapper" }, [
                        c('label', { for:"folders-list"}, [c('div', {className: `fa fa-folder`}), ""]),
                        c('select', { 
                          id: "folders-list",
                          onChange: (e) => setCurrFolderPath(e.target.value),
                          value: currFolderPath2
                        }, [
                          allFolders.map(f => c('option', { 
                            value: f, 
                          }, [f]))
                        ]),
                      ]),
                      
                    // Math.random(),
                      c('span', { className: "upload-wrapper" }, [
                        c('label', { for:"upload-button"}, [c('div', {className: `fa fa-paperclip`}), " Upload File"]),
                        c('input', { type:"file", id: "upload-button", onChange: handleFileChange }),
                        // status !== "" && c('div', {  className: "wrapper-status"}, [JSON.stringify({status, ...globStats})]),
                        status !== "" && c('div', {  className: "wrapper-status"}, [status]),
                      ]),
                    ]),

                    TableComp(),
                    
                ])
            )
        }
        
        let int = setInterval(() => {
          if (!window.ReactDOM || !ReactDOM || !React) return;
          clearInterval(int)
          const r = React;
          const c = r.createElement;
    
          // v18
          // console.log("table render component")
          ReactDOM.render(
            c(App),
            document.getElementById("root-react")
          );  
        }, 1000) 
    }
    api.utils.loadScripts(
            [
                // "https://unpkg.com/react@18/umd/react.production.min.js",
                // "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js",
                // "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js",
                "https://unpkg.com/react@18/umd/react.development.js",
                "https://unpkg.com/react-dom@18/umd/react-dom.development.js",
                "https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js",
                `${opts.plugins_root_url}/_common/components/table.component.js`
            ],
            () => {
                

                execReactApp(innerTagStr)
                setTimeout(() => {
                    api.utils.resizeIframe(opts.size);
                }, 100);
            }
    );
      
    const styleApp = `
        .with-padding {
          padding: 0px!important;
        }
        #root-react {
                height: 100vh;
                margin-top:10px;
        }

        .files-commands-wrapper {
          display: flex;
          margin: 0px 15px;
          justify-content: space-between;
        }
          .files-commands-wrapper .fa {
            padding: 0px 5px;
          }
          .folders-list-wrapper {
          }
          .upload-wrapper {
            cursor:pointer;
          }
          .upload-wrapper label {
            cursor:pointer;
          }
          .upload-wrapper #upload-button {
            visibility:hidden;
            display:none;
          }




        .wrapper-status {
          position: fixed;
          top: 0px;
          left: 0px;
          width: 100%;
          background: green;
          color: white;
          text-align: center;
        }

        
       

        table {
          width: 100%;
        }
        table thead {
          cursor:pointer;
        }
        table tbody {}
        table tr:nth-child(even) {background: #CCC}
        table tr:nth-child(odd) {background: #EEE}
        table tr td { 
          word-break: break-all; 
          border:none; 
          padding: 1px 11px;
        }
    
    `;

    return `
    <div id='root-react'></div>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
    ${styleApp}
    </style>
    `
}

window.initCustomTag = FilesTagApp
