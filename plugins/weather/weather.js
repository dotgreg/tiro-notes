const plugin_infos = {
    versions: [
    {version: "0.1.0", date: "18/06/23", comment: "adaptation to plugin"},
    ]}
    
    return [{
      name: "meteo3",
      type: "bar",
      code: `api.ressource.fetchEval("http://dev111111111111.websocial.cc:8088/weather/weather.bar.js", {barApi, tiroApi})`,
      plugin_infos,
    }]
    