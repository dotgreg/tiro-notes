// refresh datas everytime
barApi.disableCache()

// lat - lon - pays
let aix = [43.529742, 5.447427, "Aix en Provence"]
let pos = aix

// other
//let dLabels = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"]
let dLabels = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]
let titre = `=== Weather at ${pos[2]}`

// emo
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

// logic
api.ressource.fetch(`http://api.openweathermap.org/data/2.5/onecall?lat=${pos[0]}&lon=${pos[1]}&appid=xxxxxxxxxxxxxxxxx&units=metric`, txt => {
		console.log("WEATHER PLUGIN", JSON.parse(txt))
		let obj = JSON.parse(txt)
		let days = obj.daily
		//days.unshift(obj.current)
		let res = []
		res.push({label:`=== Weather at ${pos[2]}`,value:""})
		for(var i = 0; i< days.length; i++) {
				let d = days[i]
				let date = new Date(d.dt*1000)
				let dLabel = `${dLabels[date.getDay()]}`
				// console.log(1212, dLabel, date, date.getDay())
				let r = `${dLabel} => ${getEmo(d.weather[0].icon)} - ${d.weather[0].description} - temp: ${Math.round(d.temp.day)}° (min: ${Math.round(d.temp.min)}° / max: ${Math.round(d.temp.max)}°) - feel: ${Math.round(d.feels_like.day)} (eve:${Math.round(d.feels_like.eve)}° / mor: ${Math.round(d.feels_like.morn)}° / night ${Math.round(d.feels_like.night)}°)`
				res.push({label:r,value:""})
		}
		barApi.setOptions(res)
}, {disableCache: true})
