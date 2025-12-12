// that file is passed into new Function(code, backendApi) 
// and should return a list of backend functions that will be added to backendApi.pluginsFunctions
// like backendApi.pluginsFunctions.timer_get_daily_stats


// console.log("hello world from backend timer.backend.js, it should return a cb with an array of fns inside it")

cb([
    {
        name: "timer_get_daily_stats",
        code: `
            let backendApi = getBackendApi();
            let backendFns = await getBackendApi().plugins.getBackendFunctions()
            let helloworld = backendApi.test.fntest()
            cb(
                {
                    message: \`22 hello world from timer backend function (day)\, 
                        I managed to find these parameters \${JSON.stringify(params)}\ 
                        and here is some backendApi anwsers\`, 
                    allfns:{backendFns}, 
                    apib: {backendApi} ,
                    helloworld: {helloworld}
                }
            )
        `
    },
    {
        name: "timer_get_weekly_stats",
        code: `

            cb({message: \`hello world from timer backend function (week)\, I managed to find these parameters \${JSON.stringify(params)}\ and here is backendApi \${JSON.stringify(getBackendApi())}\`})
        `
    }
])