// should run every hour
let s = bgState.vars
let curr = new Date()

let isMorning = curr.getHours() > 0 && curr.getHours() <= 12
let isAfternoon = curr.getHours() > 14 && curr.getHours() <= 20
if (config.isDev)  isAfternoon = curr.getHours() > 1 && curr.getHours() <= 20

const sendBgNotif = (daysInFuture) => {
    const h = `[WEATHER BG | ${curr.getHours()}h${curr.getMinutes()}]`
    console.log(h,  {isAfternoon, config, currHour: curr.getHours()})
    
    const fetchLibs = (cb) => {
        tiroApi.ressource.fetchEval(config.libUrl, {tiroApi},{disableCache: config.disableCache}, weatherLib => {
            cb(weatherLib)
        })
    }

    fetchLibs(weatherLib => {
        const isCachedForFewHours = !config.isDev
        weatherLib.sendNotifWeather(daysInFuture, config.pos, isCachedForFewHours)
    })
}

// MORNING
// if morning, sends todays weather
if (isMorning) sendBgNotif(0)
// if morning, sends tomorrow weather
if (isMorning) sendBgNotif(1)

// AFTERNOON
// if afternoon, sends tomorrow weather
if (isAfternoon) sendBgNotif(1)
