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
import { evalBackendCode } from "./eval.manager";
import { iCustomBackendApiAnswer } from "./customBackendApi.manager";

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

    const filterByType = (res) => {
        if (!type) return res
        let resFn = { plugins: [], scanLog: [] }
        // clone
        resFn = JSON.parse(JSON.stringify(res))
        if (type) {
            resFn.plugins = resFn.plugins.filter(p => p.type === type)
        }
        return resFn
    }


    let endPerf = perf(`📂  askPluginsList shouldRescanPluginFolder?:${pluginsListCache.shouldRescan}`)

    if (!pluginsListCache.shouldRescan && pluginsListCache.cache) return filterByType(pluginsListCache.cache)
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

    endPerf()
    return filterByType(res)
}


//////////////////////////////////////////////////
//
// FOR BACKEND PLUGIN FUNCTIONS, we eval code for each "code" of backend function declared
//
//

export type iPluginBackendFunction = { name: string, code: string }
export type iPluginBackendFunctionDic = { [name: string]: { code: string } }

export const listBackendPluginsFunctions = async (
    cache:boolean=true
): Promise<iPluginBackendFunctionDic> => {

    let endPerf = perf(`📂  askPluginsList shouldRescanPluginFolder?:${pluginsListCache.shouldRescan}`)
    let backendPlugins = await (await scanPlugins("backend", cache)).plugins

    if (!backendPlugins) return {}

    let allPluginFunctions: {curr:iPluginBackendFunction[]} = {curr:[]}
    return new Promise<iPluginBackendFunctionDic>((resolve, reject) => {
        let counter = 0
        for (let p of backendPlugins) {
            // for each plugin, we exec the code, it should normally output an array of dic
            // let codeToEval = `cb(${p.code})`
            let codeToEval = p.code
            evalBackendCode(codeToEval, {}, evalRes => {

                if (evalRes.status === "success" && isArray(evalRes.result)) {
                    allPluginFunctions.curr.push(...evalRes.result) 
                } else {
                    allPluginFunctions.curr.push({name: `PLUGIN_LOAD_ERROR_${p.name}`, code: evalRes.result})
                }
            
                counter++
                // console.log(counter, backendPlugins.length)
                if (counter === backendPlugins.length) {
                    let dicFns: iPluginBackendFunctionDic = {}
                    for (let fn of allPluginFunctions.curr) {
                        dicFns[fn.name] = {code: fn.code}
                    }

                    resolve(dicFns)
                    endPerf()
                }
            })
        }
    })
}

export const triggerBackendFunction = async (name: string, params: any): Promise<iCustomBackendApiAnswer> => {
    let availablePluginBackendFunctions = await listBackendPluginsFunctions();
    if (!availablePluginBackendFunctions[name]) {
        return { status: "error", result: "Function not found for " + name };
    }
    return new Promise((resolve, reject) => {
        let fn = availablePluginBackendFunctions[name];
        if (!fn) {
            return reject({ status: "error", result: "Function not found for " + name });
        }
        evalBackendCode(fn.code,  params , res => {
            if (res.status === "error") {
                return reject({ status: "error", result: res.result });
            }
            resolve(res);
        });
    });
};

    //                 resolve(res);
    //             });
    //         } else {
    //             resolve({ status: "error", result: "Function not found in backend plugins functions", params:urlParams, available });
    //         }
    // return new Promise((resolve, reject) => {
    //     let fn = availablePluginBackendFunctions[name];
    //     if (!fn) {
    //         return reject({ error: "Function not found", name });
    //     }
    //     evalBackendCode(fn.code, { params }, res => {
    //         if (res.status === "error") {
    //             return reject({ error: res.error, name });
    //         }
    //         resolve(res);
    //     });
    // });
// };
