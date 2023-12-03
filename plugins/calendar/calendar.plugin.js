const plugin_infos = {
  versions: [
    {version: "0.1.3.5", date: "24/07/23", comment: "fix weekly_event bug"},
    {version: "0.1.3", date: "10/07/23", comment: "isDev option added"},
    {version: "0.1.2", date: "10/07/23", comment: "fixing bug for repeat yearly, adding repeat weekly, adding global caching option"},
    {version: "0.1.1", date: "25/06/23", comment: "adding bg service"},
    {version: "0.1.0", date: "24/06/23", comment: "adaptation to plugin"},
  ]
}

let disableCache = false
let bgInterval =  11
let isDev = false
if (isDev) bgInterval = 0.1
if (isDev) disableCache = true

let notePath = "/_new/_main/EVENTS.md"
let baseUrl = "http://dev111111111111.websocial.cc:8088/"
baseUrl = "https://raw.githubusercontent.com/dotgreg/tiro-notes/dev/plugins/"
let libUrl =  baseUrl + "calendar/calendar.lib.js"

return [
{
  name: "calendar",
  type: "bar",
  code: `
    tiroApi.ressource.fetchEval(
      "${baseUrl}calendar/calendar.bar.js", 
      {barApi, tiroApi, config: {calNotePath: "${notePath}", libUrl: "${baseUrl}calendar/calendar.lib.js"}}, 
      {disableCache:${disableCache}}
    )`,
    plugin_infos,
},
{
  name: "calendar",
  type: "tag",
  code: `
    [[script]]
    window.disableCache = ${disableCache};
    api.utils.canScrollIframe(true);
    return api.utils.loadCustomTag(
      "${baseUrl}calendar/calendar.tag.js",
      \`{{innerTag}}\`,
       {size:"80%", padding: false, source: "${notePath}", libUrl: "${libUrl}"}
     )
    [[script]]
  `,
  plugin_infos,
},
{
  name: "calendar_bg",
  type: "background",
  code: `
      tiroApi.ressource.fetchEval(
        "${baseUrl}calendar/calendar.bg.js", 
        {tiroApi, bgState, config: {calNotePath: "${notePath}", libUrl: "${libUrl}"}}, 
        {disableCache:${disableCache}}
      )
    `,
  plugin_infos,
  options: {
      background_exec_interval_in_min: bgInterval,
    }
}
]


