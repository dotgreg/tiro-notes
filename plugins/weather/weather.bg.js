// should run every hour
let s = bgState.vars
let curr = new Date()

let isAfternoon = curr.getHours() > 14 && curr.getHours() <= 20
if (config.isDev)  isAfternoon = curr.getHours() > 1 && curr.getHours() <= 20

if (isAfternoon) {
    const h = `[WEATHER BG | ${curr.getHours()}h${curr.getMinutes()}] {isAfternoon, config, currHour: curr.getHours()}`
    console.log(h, {s})
    const fetchLibs = (cb) => {
        tiroApi.ressource.fetchEval(config.libUrl, {tiroApi},{disableCache: config.disableCache}, weatherLib => {
            cb(weatherLib)
        })
    }

    fetchLibs(weatherLib => {
        const isCachedForFewHours = !config.isDev
        weatherLib.sendNotifWeather(1, config.pos, isCachedForFewHours)
    })
  
    
    
}
