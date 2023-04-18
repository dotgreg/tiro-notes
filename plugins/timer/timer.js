//
// BAR
//
const barPlugin = `
  const cronCacheName = "timer_bg"
   const updateOpts = () => {
     let post = \` => \${barApi.inputTxt} minutes\`
     let res = []
     res.push({label:"start"+post, value:"start", time: barApi.inputTxt})
     res.push({label:"stop", value: "stop", time: barApi.inputTxt})
     barApi.setOptions(res)
   }
   // UPDATE ON CHANGE
   const reactToUpdates = () => {
     console.log(12333, barApi)
     if (barApi.selectedTags.length > 2) {
       console.log("ACTION", barApi.selectedTags[2])
       let a = barApi.selectedTags[2]
       if (!a) return
       console.log(555,a)
       if (a.value === "start") {
         let mins = a.time
         let timer = parseInt(mins) * 60 * 1000
         let endTimestamp = new Date().getTime() + timer
         let startTimestamp = new Date().getTime()
         api.plugins.cronCache.set(cronCacheName, {endTimestamp, startTimestamp, isEnabled: true})
         api.ui.notification.emit({content: \`starting timer for \${mins} minutes \`})
         barApi.close()
       }
       if (a.value === "stop") {
         barApi.close()
         api.ui.notification.emit({content: \`stopping timer\`})
         api.plugins.cronCache.set(cronCacheName, { isEnabled: false})
       }
     }
   }
   // MAIN INIT
   updateOpts()
   //barApi.setInputTxt("30")
   //console.log(=, arApi)
   reactToUpdates()
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
  p.finalString = \`[TIMER] <br> \${p.diffInMin} m / \${p.totTime} m <br> \${p.bar}\`
  api.ui.notification.emit({content: p.finalString, options:{hideAfter: 59}})
  
`




return [{
  name: "timer",
  type: "bar",
  code: barPlugin,
},{
  name: "timer_bg",
  options: {
    background_exec_interval_in_min: 0.01
  },
  type: "background",
  code: bgTimer,
}]
// --no-latex