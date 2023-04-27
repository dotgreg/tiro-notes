const plugin_infos = {version: "0.1.1", date: "19/04/23"}

//
// BAR
//
const barPlugin = `
  let initTriggered = false
  let history = []
  //
  // STEP 1 OPTS
  //
  const updateOpts = () => {
     let time = barApi.inputTxt ? barApi.inputTxt : 60
     let post = \` => \${time} minutes\`
     let opts = []
     opts.push({label:"start"+post, value:"start", time: time})
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
         api.ui.notification.emit({content: \`stopping timer\`})
         api.plugins.cronCache.set(cronCacheName, { isEnabled: false})
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
         api.plugins.cronCache.set(cronCacheName, {endTimestamp, startTimestamp, isEnabled: true, catName:cat.catName})
         api.ui.notification.emit({content: \`starting timer for \${mins} minutes for category \${cat.catName} \`})
         addToHistory(cat.catName, mins)
         barApi.close()
       }
       if (a.value === "stop") {
         barApi.close()
         api.ui.notification.emit({content: \`stopping timer\`})
         api.plugins.cronCache.set(cronCacheName, { isEnabled: false})
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
          opts.push({label:\`\${el.name} (\${getHistStats(el)})\`, value:el.name, catName:el.name})
        }
        barApi.setOptions(opts)
     }
     const addToHistory = (catName, time) => {
       time = parseInt(time)
       // does el already exists? if yes put it on first
       const foundIdx = history.findIndex(el => el.name === catName)
       let item = history[foundIdx]
       if (foundIdx !== -1) history.splice(foundIdx, 1)
       const today = \`\${new Date().getDate()}-\${new Date().getMonth()}-\${new Date().getFullYear()}\`
       
       if (item) {
         if (item.times[today]) item.times[today] = item.times[today] + time
         else item.times[today] = time
       } else {
         item = {name:catName, times:{}}
         item.times[today] = time
       }
       history.unshift(item)
       console.log("add 2 history", history)
       api.cache.set("timer_plugin_history", history, -1)
     }

    api.cache.get("timer_plugin_history", nHist => { 
      // console.log(1212, nHist)
     // MAIN INIT
     if(nHist) history = nHist
     updateOpts()
     reactToUpdates()
  })
  
`





//
// BG
//
const bgTimer = `

    const showASCIIBar = (val, opts) => {
        val = Math.abs(val)
        if (val === -1) val = 0

        if (!opts) opts = {}
        if (!opts.min) opts.min = 0
        if (!opts.max) opts.max = 10

        if (!opts.size) opts.size = 10
        if (!opts.barFull) opts.barFull = "▓▓"
        if (!opts.barEmpty) opts.barEmpty = "░░"

        let nbBarsFull = Math.round((val / opts.max) * opts.size)
        if (nbBarsFull > opts.size) nbBarsFull = opts.size
        let nbBarsEmpty = opts.size - nbBarsFull

        let res = \`\`
        for (var i = 0; i < nbBarsFull; i++) res += opts.barFull
        for (var i = 0; i < nbBarsEmpty; i++) res += opts.barEmpty

        return res
    }
  
  // check every minute
  let s = state.vars
  if (!s.isEnabled) return
  let p = {}
  p.now = new Date().getTime()
  p.diff = s.endTimestamp - p.now
  p.diffInMin = Math.round(p.diff/(60*1000))
  p.totTime = (s.endTimestamp - s.startTimestamp)/(60*1000)

  if (p.diff < 0) return s.isEnabled = false
  
  p.bar = showASCIIBar(p.totTime - p.diffInMin, {max: p.totTime})
  p.finalString = \`[TIMER] \${s.catName} <br> \${p.diffInMin} m / \${p.totTime} m <br> \${p.bar}\`
  api.ui.notification.emit({content: p.finalString, options:{hideAfter: 59}})

  
`




return [{
  name: "timer",
  type: "bar",
  code: barPlugin,
  plugin_infos,
},{
  name: "timer_bg",
  type: "background",
  code: bgTimer,
  plugin_infos,
  options: {
    background_exec_interval_in_min: 0.01,md
  },
}]
// --no-latex 