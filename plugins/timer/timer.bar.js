
const fetchLibs = (cb) => {
    tiroApi.ressource.fetchEval(config.libUrl, {tiroApi},{disableCache: true}, timerLib => {
        cb(timerLib)
    })
}
fetchLibs(timerLib => {
    main(timerLib)
})

const main = (timerLib) => {
    const notifUniqId = "uniq-notif-id-timer"
    let initTriggered = false
    let history = []
    //
    // STEP 1 OPTS
    //
    const updateOpts = () => {
        let time = barApi.inputTxt ? barApi.inputTxt : 60
        let post = ` => ${time} minutes`
        let opts = []
        opts.push({label:"start"+post, value:"start", time: time})
        opts.push({label:"log"+post, value:"log", time: time})
        opts.push({label:"stop", value: "stop", time: time})
        barApi.setOptions(opts)
    }

    //
    // UPDATE ON CHANGE
    //
    const cronCacheName = "timer_bg"
    const reactToUpdates = () => {
        if (barApi.selectedTags.length === 2) {
        //if (barApi.inputTxt === "") barApi.setInputTxt(" 60")
        } if (barApi.selectedTags.length === 3) {
        
        // create an option with categories
        let a = barApi.selectedTags[2]
        if (a.value === "stop") {
            barApi.close()
            tiroApi.ui.notification.emit({id:notifUniqId, content: `stopping timer`})
            tiroApi.plugins.cronCache.set(cronCacheName, { isEnabled: false})
        } else {
            genOptsFromHistory()
        }  
        } else if (barApi.selectedTags.length === 4) {
            let cat = barApi.selectedTags[3]
            let a = barApi.selectedTags[2]
            if (!a || !cat) return
            if (a.value === "start") {
                let mins = a.time
                let timer = parseInt(mins) * 60 * 1000
                let endTimestamp = new Date().getTime() + timer
                let startTimestamp = new Date().getTime()
                tiroApi.plugins.cronCache.set(cronCacheName, {endTimestamp, startTimestamp, isEnabled: true, catName:cat.catName})
                tiroApi.ui.notification.emit({id:notifUniqId,content: `Stopping old timers and starting timer for ${mins} minutes for category ${cat.catName} `, options:{hideAfter: 65}})
                addToHistory(cat.catName, mins)
                barApi.close()
            }
            if (a.value === "log") {
                let mins = a.time
                let timer = parseInt(mins) * 60 * 1000
                addToHistory(cat.catName, mins)
                barApi.close()
            }
            if (a.value === "stop") {
                barApi.close()
                tiroApi.ui.notification.emit({id:notifUniqId,content: `stopping timer`})
                tiroApi.plugins.cronCache.set(cronCacheName, { isEnabled: false})
            }
        }
    }

    //
    // STEP 2 OPTS HISTORY
    //
    const getHistStats = (o) => {
        let tot = 0
        for (const dat in o.times) {
            let s = o.times[dat]
            tot = tot + parseInt(s)
        }
        tot = Math.round(tot / 6)/10 
        return tot
    }
    const genOptsFromHistory = () => {
        let opts = []
        opts.push({label:"[Categories] add new category : " + barApi.inputTxt, value:"newcat", catName: barApi.inputTxt})
        for (var i = 0; i < history.length; i++) {
            let el = history[i]
            opts.push({label:`${el.name} (${getHistStats(el)})`, value:el.name, catName:el.name})
        }
        barApi.setOptions(opts)
    }
    const addToHistory = (catName, time, rawdate) => {
        time = parseInt(time)
        // does el already exists? if yes put it on first
        const foundIdx = history.findIndex(el => el.name === catName)
        let item = history[foundIdx]
        if (foundIdx !== -1) history.splice(foundIdx, 1)

        let currDate = new Date()
        if (rawdate) currDate = rawdate
        let currDateStr = `${currDate.getDate()}-${currDate.getMonth()}-${currDate.getFullYear()}`
        
        if (item) {
            if (item.times[currDateStr]) item.times[currDateStr] = item.times[currDateStr] + time
            else item.times[currDateStr] = time
        } else {
            item = {name:catName, times:{}}
            item.times[currDateStr] = time
        }
        history.unshift(item)
        console.log("add 2 history", history)
        tiroApi.cache.set("timer_plugin_history", history, -1)
    }

    tiroApi.cache.get("timer_plugin_history", nHist => { 
        // MAIN INIT
        if(nHist) history = nHist
        updateOpts()
        reactToUpdates()
    })
}