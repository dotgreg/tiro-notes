const plugin_infos = {
  versions: [
    {version: "0.1.2", date: "24/03/24", comment: "adding showWearAdvices option and improved weather display"},
    {version: "0.1.1.2", date: "10/07/23", comment: "adding a popup that gives tomorrows weather + dev + option to not show tomorrow popup"},
    {version: "0.1.0", date: "18/06/23", comment: "adaptation to plugin"},
  ]
}

let conf = {
  pos: [48.8588548, 2.347035, "Paris"],
//pos: [47.181870, -2.376164, "palmyre"],
  showTomorrowPopup: true,
  showWearAdvices:[8,17]
}

let isDev = true
let disableCache = true        
let bgInterval =  8*60
if (isDev) bgInterval = 10
if (!conf.showTomorrowPopup) bgInterval = Math.pow(9,99)
if (isDev) disableCache = true
let baseUrl = "https://devd11111111111-3019-priv.websocial.cc/" 
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
                  pos:${JSON.stringify(conf.pos)},
                  all:${JSON.stringify(conf)}
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
              config: { 
                libUrl: "${libUrl}", 
                disableCache: ${disableCache}, 
                pos:${JSON.stringify(conf.pos)},
                all:${JSON.stringify(conf)}
              }
            }, 
            {disableCache:${disableCache}}
          )
        `,
        plugin_infos,
      }
  ]
    