const FilesTagApp = (innerTagStr, opts) => {
    if (!opts) opts = {}
    const h = `[CTAG FILES]Z`
    const api = window.api;
    const divId = `feed-${api.utils.uuid()}`;

    const execReactApp = (str) => {
        // loading commons libs & plugins 
        const Table = window._tiroPluginsCommon.tableComponent
        
        const r = React;
        const c = React.createElement;
        const App = () => {
            const [status, setStatus] = r.useState("hello world react ctag")

            // console.log(111, _.each)
            //
            // FILE UPLOAD
            //
            const handleFileChange = (event) => {
                const file = event.target.files[0];
                console.log(file); // Log the selected file to the console
                const apiParams = {
                    file,
                    folderPath: "/demos/",
                }
                api.call("upload.uploadFile", [apiParams], res => {
                    console.log(12222222, res)
                })
            };


            //
            // FILES LIST
            //
            const [files, setFiles] = r.useState([])
            r.useEffect(() => {
                api.call("ressource.scanFolder", [api.utils.getInfos().file.folder], res => {
                    console.log(12222222, res)
                    // 

                    setFiles(res.files)
                })
            },[])


            const items = [
                {
                  id: '1image1', 
                  image: 'https://via.placeholder.com/150',
                  name: 'Image 1',
                  size: '5mb',
                  icon: 'fa-image',
                  prop1: '3xProperty 1',
                  prop2: '31Property 2',
                },
                {
                  id: '2image2', 
                  image: 'https://via.placeholder.com/150',
                  name: 'Image 2',
                  size: '10mb',
                  icon: 'fa-image',
                  prop1: '1wwwProperty A',
                  prop2: '2eeProperty B',
                },
                {
                  id: '3image44444', 
                  image: 'https://via.placeholder.com/150',
                  name: 'Image wwww',
                  size: '10mb',
                  icon: 'fa-image',
                  prop1: '2dddddd A',
                  prop2: '1ddddddddddd B',
                },
              ];
              
              const config = {
                showGalleryView: true,
                cols: [
                  {colId: "icon", headerLabel: "type", type:"icon"},
                  {colId: "name", headerLabel: "name2"},
                  {colId: "prop1", headerLabel: "prop1"},
                  {colId: "prop2", headerLabel: "prop2"},
                  {colId: "size"},
                  {colId: "actions", type: "buttons", buttons:[
                    {
                      label: "x", 
                      icon: "x", 
                      onClick: (id) => {
                        console.log('Delete clicked for id:', id);
                      }
                    },
                    {
                        label: "Size", 
                        icon: "Size", 
                        onClick: (id) => {
                          console.log('Delete clicked for id:', id);
                        }
                      }
                  ]},
                ]
              };

            
            return (
                c('div', { className: "app-wrapper" }, [
                    status,
                    c('input', { type:"file", id: "upload-button", onChange: handleFileChange }),
                    Table({items, config})
                    // c(Table, { items, config });
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
                overflow: hidden;
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
