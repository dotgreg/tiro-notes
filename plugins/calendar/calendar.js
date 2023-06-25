const plugin_infos = {
  versions: [
    {version: "0.1.1", date: "26/06/23", comment: "adding bg service"},
    {version: "0.1.0", date: "25/06/23", comment: "adaptation to plugin"},
  ]
}

let baseUrl = "http://dev111111111111.websocial.cc:8088/"
//baseUrl = "https://raw.githubusercontent.com/dotgreg/tiro-notes/dev/plugins/"


return [
{
  name: "calendar",
  type: "bar",
  code: `
    tiroApi.ressource.fetchEval(
      "https://raw.githubusercontent.com/dotgreg/tiro-notes/master/plugins/calendar/calendar.bar.js", 
      {barApi, tiroApi, config: {calNotePath: "/_new3/EVENTS.md"}}, 
      {disableCache:true}
    )`,
    plugin_infos,
},
{
  name: "calendar_bg",
  type: "background",
  code: `
      tiroApi.ressource.fetchEval("${baseUrl}calendar/calendar.bg.js", {tiroApi, bgState}, {disableCache:true})
    `,
  plugin_infos,
  options: {
      background_exec_interval_in_min: 0.01,
    }
}
]
//60

