// assuming react is already loaded in window
let listComponent = (p) => {
    const r = React;
    const c = r.createElement;
    
    const [status, setStatus] = r.useState("hello world react ctag loaded from simple js lib")
    r.useEffect(() => {
        console.log("woop", p)
        setTimeout(() => {setStatus(12333333)}, 3000)
        api.call("ui.notification.emit",[{content:"hello world common lib comp api"}])
    }, [])
    return (
        c('div', { className: "app-wrapper" }, [
            status,
        ])
    )
}


if (!window._tiroPluginsCommon) window._tiroPluginsCommon = {}
window._tiroPluginsCommon.listComponent = listComponent
