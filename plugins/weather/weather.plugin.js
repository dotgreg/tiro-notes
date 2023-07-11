const plugin_infos = {
  versions: [
    {version: "0.1.1", date: "10/07/23", comment: "adding a popup that gives tomorrows weather + dev + option to not show tomorrow popup"},
    {version: "0.1.0", date: "18/06/23", comment: "adaptation to plugin"},
  ]
}

let conf = {
  pos: [48.8588548, 2.347035, "Paris"],
  showTomorrowPopup: true
}
let isDev = true
let disableCache = false
let bgInterval =  60
if (isDev) bgInterval = 0.1
if (!conf.showTomorrowPopup) bgInterval = Math.pow(9,99)
if (isDev) disableCache = true
let baseUrl = "http://dev111111111111.websocial.cc:8088/"
if (!isDev) baseUrl = "https://raw.githubusercontent.com/dotgreg/tiro-notes/dev/plugins/"
let libUrl =  baseUrl + "weather/weather.lib.js"
    
    return [
      {
        name: "weather_bg",
        type: "background",
        code: `
            tiroApi.ressource.fetchEval(
              "${baseUrl}weather/weather.bg.js", 
              {
                tiroApi, bgState, 
                config: {
                  libUrl: "${libUrl}", 
                  disableCache: "${disableCache}", 
                  isDev: "${isDev}", 
                  showNotifOnceEvery: 8*60, 
                  pos:${JSON.stringify(conf.pos)}
                }
              }, 
              {disableCache:${disableCache}}
            )
          `,
          plugin_infos,
          options: {
            background_exec_interval_in_min: bgInterval,
          }
      },
      {
        name: "weather",
        type: "bar",
        code: `
          tiroApi.ressource.fetchEval(
            "${baseUrl}weather/weather.bar.js", 
            {
              barApi, tiroApi, 
              config: { libUrl: "${libUrl}", disableCache: "${disableCache}", pos:${JSON.stringify(conf.pos)}
            }, 
            {disableCache:${disableCache}}
          )
        `,
        plugin_infos,
      }
  ]
    