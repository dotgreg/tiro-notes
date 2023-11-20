const FilesTagApp = (innerTagStr, opts) => {
    if (!opts) opts = {}
    const h = `[CTAG FILES]Z`
    const api = window.api;
    const divId = `feed-${api.utils.uuid()}`;

    const execReactApp = (str) => {
        // loading commons libs & plugins 
        const TableReact = window._tiroPluginsCommon.tableComponentReact
        
        const r = React;
        const c = React.createElement;
        const ressourceFolder = `${api.utils.getInfos().file.folder}`
        const App = () => {
            const [status, setStatus] = r.useState()
            const [rescan, setRescan] = r.useState(0)
            
            // console.log(111, _.each)
            //
            // FILE UPLOAD
            //
            const notifId = "files-ctag-upload-notif"
            const handleFileChange = (event) => {
                const file = event.target.files[0];
                console.log(event.target.files);  
                const apiParams = {
                    file,
                    folderPath: ressourceFolder,
                }
                setStatus("Uploading files...")
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
              
              else return "file"
            }

            //
            // FILES LIST
            //
            const [files, setFiles] = r.useState([])
            const [globStats, setGlobStats] = r.useState({size:0, nb:0})
            r.useEffect(() => {
              setStatus("Scanning...")
              api.call("ressource.scanFolder", [ressourceFolder], res => {
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
            },[rescan])

            const config = {
              showGalleryView: true,
              cols: [
                {colId: "icon", headerLabel: "-", type:"icon"},
                {colId: "name", headerLabel: "Name"},
                // {colId: "size", headerLabel: `Size (Mb) - ${globStats.size} tot`},
                {colId: "size", headerLabel: `Size (Mb)`},
                {colId: "type", headerLabel: "Type"},
                {colId: "created", headerLabel: "Date"},
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

            
            return (
                c('div', { className: "files-table-wrapper" }, [
                    c('span', { className: "upload-wrapper" }, [
                      c('button', {}, ["Check usage"]),
                      c('label', { for:"upload-button"}, [c('div', {className: `fa fa-paperclip`}), " Upload File"]),
                      c('input', { type:"file", id: "upload-button", onChange: handleFileChange }),
                      c('div', {  className: "wrapper-status"}, [JSON.stringify({status, ...globStats})]),
                    ]),
                    TableReact({items:files, config}),
                    
                ])
            )
        }
        setTimeout(() => {
            ReactDOM.render(
                c(App),
                document.getElementById("root-react")
            );  
        }, 500) 
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
        #root-react {
                height: 100vh;
                // overflow: hidden;
                padding: 10px;
                margin-top:10px;
        }

        
        .upload-wrapper {
          position: absolute;
          right: 13px;
          top: 26px;
          cursor:pointer;
        }
        .upload-wrapper label {
          cursor:pointer;
        }
        .upload-wrapper #upload-button {
          visibility:hidden;
          display:none;
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
