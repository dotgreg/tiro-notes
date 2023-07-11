// lat - lon - pays
//let aix = [43.529742, 5.447427, "Aix en Provence"]

let dLabels = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]

const fetchLibs = (cb) => {
  tiroApi.ressource.fetchEval(config.libUrl, {tiroApi},{disableCache: true}, weatherLib => {
    cb(weatherLib)
  })
}
fetchLibs(weatherLib => {
  main(weatherLib)
})

const main = (weatherLib) => {
  weatherLib.getWeatherData(config.pos, apiRes => {
    // logic
    let days = apiRes.daily
    let res = []
    res.push({label:`=== Weather at ${config.pos[2]}`,value:""})
    for(var i = 0; i< days.length; i++) {
      let d = days[i]
      let date = new Date(d.dt*1000)
      let dLabel = `${dLabels[date.getDay()]}`
      let str3 = `${dLabel}:   [ ${weatherLib.getEmo(d.weather[0].icon)} ${Math.round(d.temp.min)}°-${Math.round(d.temp.max)}°] ${d.weather[0].description} `
      res.push({label:str3,value:""})
    }
    barApi.setOptions(res)
  })
}
