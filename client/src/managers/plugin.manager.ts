import { each, isUndefined } from "lodash"
import { getApi } from "../hooks/api/api.hook"
import { devCliAddFn, notifLog } from "./devCli.manager"

let cacheId = "plugins-cron-infos"
const h = `[PLUGIN CRON]`
devCliAddFn('cron', 'trigger', () => {triggerCron()})

let hasBgPluginCronStarted = false
export const startFrontendBackgroundPluginsCron = () => {
    console.log(h, "starting frontendBackgroundPlugins Cron")
    if (hasBgPluginCronStarted) return

    // every minute
    let intervalTime = 1000 * 60
    // let intervalTime = 1000 * 20
    
    let int = setInterval(() => {
        // get scan list and only get the bg types
        triggerCron()
    }, intervalTime)
}

const triggerCron = () => {
    getApi(api => {
        // get the cached infos of all cron, especially the last ran date
        api.plugins.list(plugins => {
            api.cache.get(cacheId, cronState => {
                if (!cronState) cronState = {}
                // if lastRanDate + p.options.runInterval < now
                console.log(h, `starting new batch cron`, {plugins, cronState})
                each(plugins, p => {
                    let enabled = true
                    if (p.options?.disabled === false) enabled = false
                    if (p.type !== "background" || !enabled) return
                    if (!cronState[p.name]) cronState[p.name] = {vars:{}}

                    // by default, run every hour
                    let intervalRun = (p.options?.background_exec_interval_in_min || 60) * 60 * 1000
                    let now = new Date().getTime()
                    let lastRun = cronState[p.name]?.lastRunTime || 0
                    if (lastRun + intervalRun > now) return console.log(h, `bg plugin ${p.name}, wait for ${Math.round((lastRun + intervalRun - now)/1000)} seconds` )
                    //  Function() the code with an api injection inside its variables 
                    console.log(h, `exec the bg plugin ${p.name}, last exec was ${new Date(lastRun).toJSON()}`, p)
                    try {
                        const state = cronState[p.name]
                        new Function('api','state', p.code)(api, state)
                    } catch (error) {
                        const errorStr = ` ${h}, error from bg plugin ${p.name} ${error}`
                        // api.ui.notification.emit({content: errorStr, options:{hideAfter: 30, type:"warning"}})
                        notifLog(`${errorStr}`)
                    }
                    
                    // update the cache
                    if (!cronState[p.name] || isUndefined( cronState[p.name])) cronState[p.name] = {vars:{}}
                    cronState[p.name].lastRunTime = now
                })
                api.cache.set(cacheId, cronState, -1)
            })
        })
    })
}