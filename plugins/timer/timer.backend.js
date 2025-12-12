// that file is passed into new Function(code, backendApi) 
// and should return a list of backend functions that will be added to backendApi.pluginsFunctions
// like backendApi.pluginsFunctions.timer_get_daily_stats


// console.log("hello world from backend timer.backend.js, it should return a cb with an array of fns inside it")

cb([
    {
        name: "timer_get_daily_stats",
        code: `
            // console.log(getBackendApi(), params)
            cb({message: "hello world from timer backend function (day)", params})
        `
    },
    {
        name: "timer_get_weekly_stats",
        code: `
            // console.log(getBackendApi(), params)
            cb({message: "hello world from timer backend function (week)", params})
        `
    }
])