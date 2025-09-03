const FilesTagApp = (innerTagStr, opts) => {
    if (!opts) opts = {}
    const h = `[CTAG FILES]`
    const api = window.api;
    const divId = `feed-${api.utils.uuid()}`;
    const execReactApp = (str) => {
        const c = React.createElement;
        const App = () => {
            const [status, setStatus] = React.useState("hello world react ctag")
            // console.log(111, _.each)
            return (
                c('div', { className: "app-wrapper" }, [
                    status
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
                    // "https://unpkg.com/react@18/umd/react.development.js",
                    // "https://unpkg.com/react-dom@18/umd/react-dom.development.js",
                    "https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.production.min.js",
                    "https://cdn.jsdelivr.net/npm/react-dom@18.2.0/index.min.js",
                    "https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js",
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
