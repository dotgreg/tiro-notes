import { each, isArray, isString, rest } from "lodash";
import { iApiDictionary } from "../../../shared/apiDictionary.type";
import { sharedConfig } from "../../../shared/shared.config";
import { iPlugin, iPluginType } from "../../../shared/types.shared";
import { backConfig } from "../config.back";
import { scanDirForFiles } from "./dir.manager";
import { openFile } from "./fs.manager";
import { ServerSocketManager } from "./socket.manager";
import { getBackendApi } from "./backendApi.manager";
import { perf } from "./performance.manager";

const h = `[PLUGINS]`
type iRes = {plugins:iPlugin[], scanLog:string[]}

// only rescan
// 1) if edition inside plugin folder
// 1) if tiro restarted
export const pluginsListCache:{
    shouldRescan:boolean, 
    cache: iRes | null
} = {shouldRescan: true, cache:null}

export const rescanPluginList = () => {
    console.log(h, "== RESCAN PLUGINS LIST ==")
    pluginsListCache.shouldRescan = true
}
export const relPluginsFolderPath = `${sharedConfig.path.configFolder}/plugins/`
const asbPluginsFolderPath = () => `${backConfig.dataFolder}/${relPluginsFolderPath}`

export const scanPlugins = async (
    type:iPluginType|null=null,
    cache:boolean=true, 
):Promise<iRes> => {

    let endPerf = perf(`📂  askPluginsList shouldRescanPluginFolder?:${pluginsListCache.shouldRescan}`)

    if (!pluginsListCache.shouldRescan && pluginsListCache.cache) return pluginsListCache.cache
    pluginsListCache.shouldRescan = false

    let res:iRes = {plugins:[], scanLog:[]}
    

    let pluginFiles = await scanDirForFiles(asbPluginsFolderPath())
    if (!isArray(pluginFiles)) return res
    // filter out non md files
    pluginFiles = pluginFiles.filter(f => f.name.endsWith('.md'))

    const promises = pluginFiles.map(async f => {
        let fullpath = `${backConfig.dataFolder}/${f.path}`
        let pluginRawContent = await openFile(fullpath)
        

        try {
            let interpretedCode = new Function(pluginRawContent)() 
            // check that an array is return and each has name, type etc. to become a iPlugin
            if (isArray(interpretedCode)) { 
                each(interpretedCode, p => {
                    if (p.name && p.type && p.code) {
                        res.plugins.push(p as iPlugin)
                    } else {
                        res.scanLog.push(`load error for ${f.name}, prop missing for ${JSON.stringify(p)}}`)
                    }
                }) 
            }
        } catch (e) {
            res.scanLog.push(`load error for ${f.name} ${JSON.stringify(e.message)}`)
        }
    })

    await Promise.all(promises)
    pluginsListCache.cache = res
    let resFn = { plugins: [], scanLog: [] }
    // clone
    resFn = JSON.parse(JSON.stringify(res))
    if (type) {
        resFn.plugins = resFn.plugins.filter(p => p.type === type)
    }

    endPerf()
    return resFn
}


//////////////////////////////////////////////////
//
// FOR BACKEND PLUGIN FUNCTIONS, we eval code for each "code" of backend function declared
//
//

export type iPluginBackendFunction = { name: string, description:string, code: string }

export const listBackendPluginsFunctions = async (
    cache:boolean=true
): Promise<iPluginBackendFunction | null> => {

    let endPerf = perf(`📂  askPluginsList shouldRescanPluginFolder?:${pluginsListCache.shouldRescan}`)
    let backendPlugins = await (await scanPlugins("backend", cache)).plugins

    if (!backendPlugins) return null

    let res:iPluginBackendFunction = { name: '', description: '', code: '' }
    for (let p of backendPlugins) {
        // for each plugin, we exec the code, it should normally output an array of dic
        let codeToEval = p.code
        getBackendApi().eval.evalBackendCode(codeToEval, {}, evalRes => {
            if (evalRes.status === "success") {
                console.log(123333333333,evalRes.result)
            }
        })
    }

    endPerf()

    return res
}