const plugin_infos = {
    images: [
        "https://github.com/dotgreg/tiro-notes/assets/2981891/ba1d0751-e140-45b0-aada-398cd27df896",
        "https://github.com/dotgreg/tiro-notes/assets/2981891/09c3ac6c-a15e-4bcd-8e92-26a879323c91",
    ],
    description: "Adds a timer functionality to Tiro",
    versions: [
        {version: "0.1.5", date: "10/07/23", comment: "adding log to timer"},
        {version: "0.1.4", date: "25/06/23", comment: "switching to plugin files"},
        {version: "0.1.3", date: "09/05/23", comment: "unique notification and sound"},
    ]}
    
    let baseUrl = "http://dev111111111111.websocial.cc:8088/"
    baseUrl = "https://raw.githubusercontent.com/dotgreg/tiro-notes/dev/plugins/"
    
    
    return [
    {
      name: "-timer",
      type: "bar",
      code: `
        tiroApi.ressource.fetchEval("${baseUrl}timer/timer.bar.js", {tiroApi, barApi},{disableCache:false})
      `,
      plugin_infos,
    },{
        name: "timer_bg",
        type: "background",
        code: `
          tiroApi.ressource.fetchEval("${baseUrl}timer/timer.bg.js", {tiroApi, bgState}, {disableCache:false})
        `,
        plugin_infos,
        options: {
          background_exec_interval_in_min: 0.01,
        }
      }
    ]
    