const FilesTagApp = (innerTagStr, opts) => {
    if (!opts) opts = {}
    const h = `[CTAG FILES]Z`
    const api = window.api;
    const divId = `feed-${api.utils.uuid()}`;

    const execReactApp = (str) => {
        // loading commons libs & plugins 
        const List = window._tiroPluginsCommon.listComponent
        
        const r = React;
        const c = React.createElement;
        const App = () => {
            const [status, setStatus] = r.useState("hello world react ctag")
            // console.log(111, _.each)
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
            return (
                c('div', { className: "app-wrapper" }, [
                    status,
                    c('input', { type:"file", id: "upload-button", onChange: handleFileChange }),
                    List({hello:"world"})
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
                `${opts.plugins_root_url}/_common/components/list.component.js`
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
