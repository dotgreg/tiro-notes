

////////////////////////////////////////////////////////////////////////////////////
// VIEWS UPDATER
//
const configSelect = document.getElementById("config-select");
const configSave = document.getElementById("config-save");
const configDelete = document.getElementById("config-delete");
configSelect.addEventListener("change", (e) => {
    restoreView(e.target.value);
});
const saveNewView = (view/*:iView*/, cb/*:Function*/) => {
    getViewsCache(
        views => {
            // if name already exists, overwrite it
            const foundIdx = views.findIndex(v => v.name === view.name)
            if (foundIdx !== -1) views[foundIdx] = view
            else views.push(view)
            // reorder views by name 
            views = views.sort((a, b) => a.name.localeCompare(b.name))
            setViewsCache(views, cb)
        }, () => {
            setViewsCache([view], cb)
        }
    )
}
const viewsSync = {curr: [], selectedName: ""}
const getCache = (id/*:string*/) => (onSuccess/*:(views:iView[]) => void*/, onFailure/*:([]) => void*/) => {
    let nviews = []
    api.call("cache.get", [id], content => {
        // console.log("cache content", content, content.length)
        let viewsFinal = []
        if (content !== undefined && content !== null && content.length !== 0) viewsFinal = [...nviews, ...content]
        else viewsFinal = nviews

        viewsSync.curr = [...viewsFinal]
        if (viewsFinal.length > 0 && viewsSync === "") viewsSync.selectedName = viewsFinal[0].name

        onSuccess(viewsFinal)
    })
}

const setCache = (id/*:string*/) => (views/*:iView[]*/, cb/*:Function*/) => {
    api.call("cache.set", [id, views, -1], () => {if(cb) cb()}) 
}
const cacheViewsId = `lib-graph-plotly-views`

const getCurrConfig = () => {
    return document.querySelector("textarea").value
}
const setCurrConfig = (config/*:string*/) => {
    document.querySelector("textarea").value = config
    
}
const restoreView = (name/*:string*/) => {
    viewsSync.selectedName = name
    const view = viewsSync.curr.find(v => v.name === name)
    setCurrConfig(view.config)
}

// if config save, prompt for a name and save it
configSave.addEventListener("click", () => {
    const config = getCurrConfig()
    let name = prompt("Enter a name for the config ", viewsSync.selectedName);
    if (name) {
        console.log("saving config", name, config)
        viewsSync.selectedName = name
        saveNewView({name, config}, () => {
            reloadViewsSelect()
        })
    }
});
configDelete.addEventListener("click", () => {
    let name = configSelect.value
    if (name) {
        deleteView(name, () => {
            reloadViewsSelect()
        })
    }
})
const reloadViewsSelect = (cb/*:Function*/) => {
    getViewsCache(
        views => {
            genViewsButtons(views)
            configSelect.innerHTML = views.map(v => `<option value="${v.name}">${v.name}</option>`).join("")
            if (views.length > 0) {
                updateSelectActiveOption(viewsSync.selectedName)
                viewer.setConfig(viewsSync.selectedName)
            }
            if (cb) cb(views)
        },
        () => {
            configSelect.innerHTML = ""
            if (cb) cb([])
        }
    )   
}

// window._graph_perspective_props
const getViewsCache = getCache(cacheViewsId)
const setViewsCache = setCache(cacheViewsId)