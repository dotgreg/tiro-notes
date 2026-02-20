const notifUniqId = "uniq-notif-id-timer"
const showASCIIBar = (val, opts) => {
    val = Math.abs(val)
    if (val === -1) val = 0

    if (!opts) opts = {}
    if (!opts.min) opts.min = 0
    if (!opts.max) opts.max = 7

    if (!opts.size) opts.size = 7
    if (!opts.barFull) opts.barFull = "▓▓"
    if (!opts.barEmpty) opts.barEmpty = "░░"

    let nbBarsFull = Math.round((val / opts.max) * opts.size)
    if (nbBarsFull > opts.size) nbBarsFull = opts.size
    let nbBarsEmpty = opts.size - nbBarsFull

    let res = ``
    for (var i = 0; i < nbBarsFull; i++) res += opts.barFull
    for (var i = 0; i < nbBarsEmpty; i++) res += opts.barEmpty

    return res
}


// check every minute
let s = bgState.vars
if (!s.isEnabled) return
const curr = new Date()
// const h = `[TIMER BG | ${curr.getHours()}h${curr.getMinutes()}] `
console.log(h, {s})
let p = {}
p.now = new Date().getTime()
p.diff = s.endTimestamp - p.now
p.diffInMin = Math.round(p.diff/(60*1000))
if (p.diffInMin < 0) p.diffInMin = 0
p.totTime = (s.endTimestamp - s.startTimestamp)/(60*1000)


p.bar = showASCIIBar(p.totTime - p.diffInMin, {max: p.totTime})
p.finalString = `[TIMER] ${s.catName} <br> ${p.diffInMin} m / ${p.totTime} m <br> ${p.bar}`
tiroApi.ui.notification.emit({id:notifUniqId, content: p.finalString, options:{hideAfter: 65}})

// last notif with sound
if (p.diff < 0) {
    p.finalString = `${p.finalString} <br> Completed at ${new Date().getHours()}h${new Date().getMinutes()<10?'0':''}${new Date().getMinutes()}m`
    tiroApi.ui.notification.emit({id:notifUniqId, content: p.finalString, options:{hideAfter: -1}})
    if (p.diff > - (60 * 60 * 1000)) tiroApi.audio.play("https://assets.mixkit.co/active_storage/sfx/2344/2344.wav")    
    return s.isEnabled = false
}
