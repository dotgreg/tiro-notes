//@flow

/*::
declare var tiroApi: any;
declare var config: any;
declare var barApi: any;
import type {iTimerLib, iTimerHistoryItem} from "./timer.lib"
*/

const disableCache = config.disableCache | false
const main = (timerLib/*:iTimerLib*/) => {
    
    let initTriggered = false
    let history/*:iTimerHistoryItem[]*/ = []
    //
    // STEP 1 OPTS
    //
    const updateOpts = () => {
        let time = barApi.inputTxt ? barApi.inputTxt : 60
        let post = ` => ${time} mins`
        let opts = []

        let times = [ time, null, 120, null, 240]
        for (var i = 0; i < times.length; i++) {
            if (times[i] === null)  {
                opts.push({label: ` `, value:" "})
                opts.push({label: ` `, value:" "})
                opts.push({label: ` `, value:" "})
            } else {
                let t = times[i]
                let label = ` => ${t} mins`
                // if >= 60, add hours
                let hours = (Math.floor(t / 6)) / 10
                // label = t >= 60 ? label + ` - ${hours} h` : label
                if(t >= 60) label = `=> ${hours}h (${t} mins)` 
                opts.push({label: `💾 log ${label}`, value:"log", time: t})
                opts.push({label: `🏁 start ${label}`, value:"start", time: t})
            }
        }
        opts.push({label:"❌ stop timers", value: "stop", time: time})
        // opts.push({label:"start"+post, value:"start", time: time})
        // opts.push({label:"log"+post, value:"log", time: time})
        // opts.push({label:"stop", value: "stop", time: time})

        barApi.setOptions(opts)
    }

    //
    // UPDATE ON CHANGE
    //
    // const cronCacheName = "timer_bg"
    const reactToUpdates = () => {
        if (barApi.selectedTags.length === 2) {
        } if (barApi.selectedTags.length === 3) {
             // create an option with categories
            let a = barApi.selectedTags[2]
            if (a.value === "stop") {
                timerLib.stopTimer(tiroApi, history, barApi)
            } else {
                genOptsFromHistory()
            }  
        } else if (barApi.selectedTags.length === 4) {
            let cat = barApi.selectedTags[3]
            let a = barApi.selectedTags[2]
            if (!a || !cat) return

            const historyArr = [...barApi.selectedTags]
            historyArr.pop() // remove cat
            historyArr.push({label: " ", value: " "})
            if(barApi.addToOmniHistory) barApi.addToOmniHistory(historyArr)

            if (a.value === "start") {
                timerLib.startTimer(tiroApi, history, cat.catName, a.time, barApi)
            }
            if (a.value === "log") {
                timerLib.logTimer(tiroApi, history, cat.catName, a.time, barApi)
            }
            if (a.value === "stop") {
                timerLib.stopTimer(tiroApi, history, barApi)
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
        for (var i = 0; i < history.length; i++) {
            let el = history[i]
            opts.push({label:`${el.name} (${getHistStats(el)})`, value:el.name, catName:el.name})
        }
        opts.push({label:"[➕ Categories] add new category : " + barApi.inputTxt, value:"newcat", catName: barApi.inputTxt})
        barApi.setOptions(opts)
    }
   

    tiroApi.cache.get("timer_plugin_history", nHist => { 
        // MAIN INIT
        if(nHist) history = nHist
        updateOpts()
        reactToUpdates()
    })
}

const fetchLibs = (cb/*:Function*/) => {
    tiroApi.ressource.fetchEval(config.libUrl, {tiroApi},{disableCache: disableCache }, () => {
        cb()
    })
}


//
// ACTUAL CODE
//
fetchLibs(() => {
    const timerLib = window._tiroPluginsCommon.timerLib
    main(timerLib)
})