const h = `[WEATHER LIB] `


const getEmo = (nameIcon) => {
    const objRef = {
        'cloud': '☁️',
        'thermo': '🌡️️',
        'fog': '🌫️️',
        'snow': '❄️',
        'cloudSun': '⛅',
        'cloudRain': '🌧️️',
        'cloudStorm': '🌩️',
        'sun': '☀️',
        'storm': '️⚡',
        'cloudy': '🌤️',
        'water': '🌧️️',
        'drop': '🌧️️',
    }
    // equiv https://openweathermap.org/weather-conditions
    const equiv = {
        '01': 'sun',
        '02': 'cloudy',
        '03': 'cloud',
        '04': 'cloud',
        '09': 'water',
        '10': 'water',
        '11': 'storm',
        '50': 'fog',
        '13': 'snow',
    }
    const nb = nameIcon.substring(0, 2);
    const res = objRef[equiv[nb]]
    return res;
}

const getWeatherData = (pos, cb) => {
    let res = ""
    const apiUrl = `http://api.openweathermap.org/data/2.5/onecall?lat=${pos[0]}&lon=${pos[1]}&appid=c9faf631b1c838fa4d4c0012498e2730&units=metric&units=metric`
    tiroApi.ressource.fetch(apiUrl, txt => {
        let obj = JSON.parse(txt)
        //days.unshift(obj.current)
        cb(obj)
    }, {disableCache: true})
}

const getHourlyForecast = (futureDay, apiRes) => {
    let hours = apiRes.hourly
    let hourlyObj = {}
    function futureDayAt(day, hour) {
        const futureDay = new Date();
        futureDay.setDate(futureDay.getDate() + day);
        futureDay.setHours(hour, 0, 0, 0);
        return futureDay.getTime()/1000;
    }
    let resPerHour = ``
    for (let i = 0; i < hours.length; i++) {
        const el = hours[i];
        if (el.dt < futureDayAt(futureDay, 8)) continue
        if (el.dt > futureDayAt(futureDay, 23)) continue
        let elHour = new Date(el.dt*1000).getHours()
        let elWeather = getEmo(el.weather[0].icon)
        // resPerHour += `${elHour}h: ${Math.round(el.temp)}d ${elWeather} || `
        let lineJump = (i+1) % 3 === 0 ? "<br/>" : "|"
        let tempNb = Math.round(el.temp)
        let tempStr = tempNb
        if (tempNb < 10) tempStr = `0${tempNb}`
        hourlyObj[elHour] = [tempNb, elWeather]
        elHour = elHour < 10 ? `0${elHour}` : elHour
        resPerHour += `<b>${elHour}h:</b>${tempStr}°${elWeather}${lineJump}`
    }
    return [resPerHour, hourlyObj]
} 

//js function that takes as an input a date and output a string with the following format 'Tuesday 31/12/2023'
function formatDate(inputDate) {
    const options = { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' };
    const formattedDate = inputDate.toLocaleDateString('en-US', options);
    return formattedDate;
}


const sendNotifWeather = (dayFuture, pos, isCached, hideAfter, showWearAdvices) => {
    let showNotifOnceEvery = 8*60
    if (!isCached) showNotifOnceEvery = 0
    let notifUniqId = "uniq-notif-id-weather"
    if (!hideAfter) hideAfter = -1

    // console.log(h, "showNotifWeather", {showNotifOnceEvery, notifUniqId, dayFuture, pos, isCached, hideAfter})
    getWeatherData(pos, apiRes => {
        let [resPerHour, hourlyObj] = getHourlyForecast(dayFuture, apiRes)
        let daily = apiRes.daily
        
        let nDate = new Date().getTime() + (1000 * 60 * 60 * 24 * dayFuture)
        let labelDate = `${formatDate(new Date(nDate))}`
        if (dayFuture === 0) labelDate = `Today <br>${formatDate(new Date(nDate))}`
        if (dayFuture === 1) labelDate = `Tomorrow <br> ${formatDate(new Date(nDate))}`
        if (dayFuture === 2) labelDate = `Day after tomorrow <br> ${formatDate(new Date(nDate))}`
        if (dayFuture === 3) labelDate = `In 3 days <br> ${formatDate(new Date(nDate))}`
        if (dayFuture === 4) labelDate = `In 4 days <br> ${formatDate(new Date(nDate))}`

        let showWearAdvicesStr = ""
        if (showWearAdvices) {
            hoursAdvices = showWearAdvices
            hoursAdvices.forEach(hour => {
                let hourWeather = hourlyObj[hour] 
                if (hourWeather === undefined) return
                let advice = ""
                if (hourWeather[0] < 10) advice = `🥶`
                if (hourWeather[0] < 15) advice = `👖`
                if (hourWeather[0] >= 15) advice = `🩳`
                if (hourWeather[1] === "🌧️️") advice = `☂️`
                advice += ` (${hourWeather[0]}° ${hourWeather[1]})`

                showWearAdvicesStr += `<b>${hour}h:</b> ${advice} `
            })
        }

        let notifHtml = `
            <b>[WEATHER]</b> <br>
            <b>${labelDate}'s weather:</b> <br>${Math.round(daily[1].temp.day)}° ${getEmo(daily[1].weather[0].icon)} <br><br>
            ${showWearAdvicesStr}<br/><br/>
            ${resPerHour}
        `
        tiroApi.ui.notification.emit({id:notifUniqId, content: notifHtml, options:{hideAfter, showOnceEvery: showNotifOnceEvery}})
    })
}


return {getWeatherData, getEmo, sendNotifWeather}