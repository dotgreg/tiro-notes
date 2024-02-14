const plugin_infos = {
    images: [
        "https://github.com/dotgreg/tiro-notes/assets/2981891/ba1d0751-e140-45b0-aada-398cd27df896",
        "https://github.com/dotgreg/tiro-notes/assets/2981891/09c3ac6c-a15e-4bcd-8e92-26a879323c91",
    ],
    icon: "https://github.com/dotgreg/tiro-notes/assets/2981891/af963229-a7c1-41a1-bf73-2ac97c3fa7a0",
    description: "Adds a timer functionality to Tiro <br/> this is a long description",
    versions: [
        {version: "0.2.1", date: "14/02/24", comment: "adding custom tag timer", hash: "bd5c41c1b92e3ac483578b19b8c50c39a38fd81f"},
        {version: "0.1.5", date: "10/07/23", comment: "adding log to timer", hash: "bd5c41c1b92e3ac483578b19b8c50c39a38fd81f"},
        {version: "0.1.4", date: "25/06/23", comment: "switching to plugin files", hash: "bd5c41c1b92e3ac483578b19b8c50c39a38fd81f"},
        {version: "0.1.3", date: "09/05/23", comment: "unique notification and sound", hash: "bd5c41c1b92e3ac483578b19b8c50c39a38fd81f"},
    ],
    configuration: [
      {type: "checkbox", id:"timer-sound", description: "At the end of the countdown, play a sound"},
      {type: "text", id:"timer-custom-sound-url", description: "Sound to be played at the end of the countdown, should be an absolute link and a mp3 like: <br/> http://website.com/mymp3.mp3 "}
    ]
}
let disableCache = true
let baseUrl = "https://devd11111111111-3019-priv.websocial.cc/"
//baseUrl = "https://raw.githubusercontent.com/dotgreg/tiro-notes/dev/plugins/"
let libUrl =  baseUrl + "timer/timer.lib.js"
    
return [
  {
    name: "-timer",
    type: "bar",
    code: `
      tiroApi.ressource.fetchEval("${baseUrl}timer/timer.bar.js", {tiroApi, barApi, config:{ libUrl: "${libUrl}", disableCache:${disableCache}}},{disableCache:${disableCache}})
    `,
    plugin_infos,
  },{
    name: "timer",
    type: "tag",
    code: `
        [[script]]
            window.disableCache=${disableCache} ;
            return api.utils.loadCustomTag("${baseUrl}/timer/timer.ctag.js", \`{{innerTag}}\`, 
            {size: "100%", padding: false}
          )
        [[script]]
    `,
    plugin_infos,
  },{
      name: "timer_bg",
      type: "background",
      code: `
        tiroApi.ressource.fetchEval("${baseUrl}timer/timer.bg.js", {tiroApi, bgState, config:{ libUrl: "${libUrl}", disableCache: ${disableCache}}}, {disableCache: ${disableCache}})
      `,
      plugin_infos,
      options: {
        background_exec_interval_in_min: 0.01,
      }
    }
]
    