// that file is passed into new Function(code, backendApi) 
// and should return a list of backend functions that will be added to backendApi.pluginsFunctions
// like backendApi.pluginsFunctions.timer_get_daily_stats


console.log("hello world from backend")

return [
    {
        name: "timer_get_daily_stats",
        description: "Get daily statistics for the timer",
        code: `
            console.log(backendApi, params)
            return {message: "hello world from timer backend function", params}

        `
    }
]