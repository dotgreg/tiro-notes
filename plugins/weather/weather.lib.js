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


return {getWeatherData, getEmo}