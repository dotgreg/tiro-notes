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
        'water': '💦',
        'drop': '💧',
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
        resPerHour += `<b>${elHour}h:</b> ${Math.round(el.temp)}° ${elWeather} <br/> `
    }
    return resPerHour
} 

//js function that takes as an input a date and output a string with the following format 'Tuesday 31/12/2023'
function formatDate(inputDate) {
    const options = { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' };
    const formattedDate = inputDate.toLocaleDateString('en-US', options);
    return formattedDate;
}


const sendNotifWeather = (dayFuture, pos, isCached) => {
    let showNotifOnceEvery = 8*60
    if (!isCached) showNotifOnceEvery = 0
    let notifUniqId = "uniq-notif-id-weather"


    getWeatherData(pos, apiRes => {
        let resPerHour = getHourlyForecast(dayFuture, apiRes)
        let daily = apiRes.daily
        
        let nDate = new Date().getTime() + (1000 * 60 * 60 * 24 * dayFuture)
        let labelDate = `Tomorrow ${formatDate(new Date(nDate))}`
        if (dayFuture !== 1) labelDate = formatDate(new Date(nDate))

        let notifHtml = `
            <b>[WEATHER]</b> <br>
            <b>${labelDate}'s weather:</b> <br>${Math.round(daily[1].temp.day)}° ${getEmo(daily[1].weather[0].icon)} <br><br>
            ${resPerHour}
        `
        tiroApi.ui.notification.emit({id:notifUniqId, content: notifHtml, options:{hideAfter: -1, showOnceEvery: showNotifOnceEvery}})
    })
}


return {getWeatherData, getEmo, sendNotifWeather}