// assuming react is already loaded in window
let demoComponent = (p) => {
    const r = React;
    const c = r.createElement;
    
    const [status, setStatus] = r.useState("hello world react ctag loaded from simple js lib")
    r.useEffect(() => {
        api.call("ui.notification.emit",[{content:"hello world common lib comp api"}])
    }, [])
    return (
        c('div', { className: "app-wrapper" }, [
            status,
        ])
    )
}


if (!window._tiroPluginsCommon) window._tiroPluginsCommon = {}
window._tiroPluginsCommon.demoComponent = demoComponent
