// should run every hour
let s = bgState.vars
let curr = new Date()
const h = `[WEATHER BG | ${curr.getHours()}h${curr.getMinutes()}] `
console.log(h, {s})
// const isAfternoon = curr.getHours() > 14 && curr.getHours() <= 20
const isAfternoon = curr.getHours() > 1 && curr.getHours() <= 20

if (isAfternoon) {
    let notifUniqId = "uniq-notif-id-weather"
    if (config.isDev) notifUniqId += Math.round(Math.random() * 100000)

    const fetchLibs = (cb) => {
        tiroApi.ressource.fetchEval(config.libUrl, {tiroApi},{disableCache: config.disableCache}, weatherLib => {
            cb(weatherLib)
        })
    }

    fetchLibs(weatherLib => {
        sendNotifWeather(weatherLib)
    })
  
    const sendNotifWeather = (weatherLib) => {
        weatherLib.getWeatherData(config.pos, apiRes => {
            let hours = apiRes.hourly
            let daily = apiRes.daily
            function tomorrowAt(hour) {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(hour, 0, 0, 0);
                return tomorrow.getTime()/1000;
            }
            let resPerHour = ``
            for (let i = 0; i < hours.length; i++) {
                const el = hours[i];
                if (el.dt < tomorrowAt(8)) continue
                if (el.dt > tomorrowAt(23)) continue
                let elHour = new Date(el.dt*1000).getHours()
                let elWeather = weatherLib.getEmo(el.weather[0].icon)
                // resPerHour += `${elHour}h: ${Math.round(el.temp)}d ${elWeather} || `
                resPerHour += `<b>${elHour}h:</b> ${Math.round(el.temp)}° ${elWeather} <br/> `
            }
            // console.log(123123, apiRes)
            let notifHtml = `
                <b>[WEATHER]</b> <br>
                <b>tomorrow's weather:</b> ${Math.round(daily[1].temp.day)}° ${weatherLib.getEmo(daily[1].weather[0].icon)} <br>
                ${resPerHour}
            `
            tiroApi.ui.notification.emit({id:notifUniqId, content: notifHtml, options:{hideAfter: -1, showOnceEvery: config.showNotifOnceEvery}})
        })
    }
    
}
