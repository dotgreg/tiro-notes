const plugin_infos = {
  versions: [
    {version: "0.1.1", date: "26/06/23", comment: "adding bg service", commitId: "d93e5b09767fd6f3c361958cc25dbb90d6e9e7b3"},
    {version: "0.1.0", date: "25/06/23", comment: "adaptation to plugin", commitId: "90fc03d53d86586c19e4b73c335e33cb2a1a6a2f" },
  ],
  configuration: [
    {name:"eventsNotePath", type: "text", defaultValue: "", }
  ],
  description: {
    name: "calendar",
    text: "here is a plugin for calendar",
    images: ["http://absolute.../1.jpg", "http://absolute.../2.jpg","http://absolute.../3.jpg"]
  }
}

return [
{
  name: "calendar",
  type: "bar",
  code: `
    tiroApi.ressource.fetchEval(
      tiroApi.userSettings.get("plugin_server_base_url") + "/plugins/calendar/calendar.bar.js", 
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
      background_exec_interval_in_min: 11,
    }
}
]

