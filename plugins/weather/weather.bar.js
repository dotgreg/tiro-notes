// lat - lon - pays
//let aix = [43.529742, 5.447427, "Aix en Provence"]

let dLabels = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]

const fetchLibs = (cb) => {
  tiroApi.ressource.fetchEval(config.libUrl, {tiroApi}, {disableCache: config.disableCache}, weatherLib => {
    cb(weatherLib)
  })
}

const main = (weatherLib) => {
  if (barApi.selectedTags.length === 2) {
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
        res.push({label:str3,value:date})
      }
      barApi.setOptions(res)
    })
    // historyArr.pop() // remove cat
    // historyArr.push({label: " ", value: " "})
    // setTimeout(() => {
    //   const historyArr = [...barApi.selectedTags]
    //   console.log(historyArr)
    //   if(barApi.addToOmniHistory) barApi.addToOmniHistory(historyArr)
    // , 1000})
  }

  if (barApi.selectedTags.length === 3) {
    let tag = barApi.selectedTags[2]
    function getRelativeDaysFromDate(inputDate) {
      let today = new Date(new Date().setHours(0, 0, 0, 0)); // Get today's date
      inputDate = new Date(inputDate.setHours(0, 0, 0, 0));
      const timeDifference = inputDate.getTime() - today.getTime(); 
      const millisecondsPerDay = 1000 * 60 * 60 * 24;  
      const relativeDays = Math.floor(timeDifference / millisecondsPerDay);  
      return relativeDays;
    }
    if (!tag.value) return
    let daysFuture = getRelativeDaysFromDate(tag.value)
    const isCached = false
    const hideAfter = 60
    const showWearAdvices = config.all?.showWearAdvices || false

    
    weatherLib.sendNotifWeather(daysFuture, config.pos, isCached, hideAfter, showWearAdvices)
  }
}

//
// EXECUTED CODE
// 
fetchLibs(weatherLib => {
  main(weatherLib)
})