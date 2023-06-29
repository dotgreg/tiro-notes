import { each, isArray, isString, rest } from "lodash";
import { sharedConfig } from "../../../shared/shared.config";
import { iPlugin } from "../../../shared/types.shared";
import { backConfig } from "../config.back";
import { scanDirForFiles } from "./dir.manager";
import { openFile } from "./fs.manager";

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
const asbPluginsFolderPath = `${backConfig.dataFolder}/${relPluginsFolderPath}`

export const scanPlugins = async (noCache:boolean=false):Promise<iRes> => {
    
    if (!pluginsListCache.shouldRescan && pluginsListCache.cache) return pluginsListCache.cache
    pluginsListCache.shouldRescan = false

    let res:iRes = {plugins:[], scanLog:[]}
    

    const pluginFiles = await scanDirForFiles(asbPluginsFolderPath)
    if (!isArray(pluginFiles)) return res

    const promises = pluginFiles.map(async f => {
        let fullpath = `${backConfig.dataFolder}/${f.path}`
        let pluginRawContent = await openFile(fullpath)
        // interpret it
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
    return res
}
