import { each, isUndefined } from "lodash"
import { iPlugin } from "../../../shared/types.shared"
import { getApi } from "../hooks/api/api.hook"
import { iEvalFuncParams } from "../hooks/api/ressource.api.hook"
import { devCliAddFn, notifLog } from "./devCli.manager"

// SUGGEST POPUP PLUGINS => loadExternalBarPlugin


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

let cacheId = "plugins-cron-infos"

//////////////////////////////////////////////////
// GLOBAL : evalPluginCode
//
export const evalPluginCode = (plugin:iPlugin, codeParams:iEvalFuncParams) => {
    const paramsNames:string[] = []
    const paramsValues:any[] = []
    each(codeParams, (value, name) => {
        paramsNames.push(name)
        paramsValues.push(value)
    })
    try {
        new Function(...paramsNames, plugin.code)(...paramsValues)
    } catch (e) {
        let message = `[ERR in ${plugin.type.toLocaleUpperCase()} plugin ${plugin.name.toLocaleUpperCase()}]:  ${e}`
        console.log(message, e, {paramsNames, paramsValues, plugin});
        console.trace(e)
        notifLog(`${message}`)
    }
}

// api.ressource.fetchEval(url, codeParams)



//////////////////////////////////////////////////
// BG/CRON PLUGIN CODE
//
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

                    console.log(h, `exec the bg plugin ${p.name}, last exec was ${new Date(lastRun).toJSON()}`)
                    const state = cronState[p.name]
                    evalPluginCode(p, {tiroApi:api, bgState:state})
                    
                    // update the cache
                    if (!cronState[p.name] || isUndefined( cronState[p.name])) cronState[p.name] = {vars:{}}
                    cronState[p.name].lastRunTime = now
                })
                api.cache.set(cacheId, cronState, -1)
            },{disableRamCache: true}) // cache.get important to disable ram cache to fetch the last backend lastExecTime across devices
        })
    })
}