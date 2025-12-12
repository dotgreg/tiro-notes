import { backConfig } from "../config.back";
import {  getBackendApi } from "./backendApi.manager";
import { evalBackendCode } from "./eval.manager";

////////////////////////////////
//
// CORE LOGIC SERVER
//
//
export const customBackendApiServer = async (params): Promise<any> => {

	// logic to trigger the custom backend API
    // check if api token is right
    let goodApiToken = backConfig.jsonConfig.customBackendApiToken;
    if (params.token !== goodApiToken) {
        return Promise.resolve({ error: "Invalid API token" });
    }

    // let folders: iFolder[] = []
    // folders.push(backendApi.scanDirForFoldersRecursive("/", 2))

    // scan plugins
    // let bplugins = await backendApi.plugins.scanPlugins("backend");

    // that file is passed into new Function(code, backendApi) 
    // and should return a list of backend functions that will be added to backendApi.pluginsFunctions
    // like backendApi.pluginsFunctions.timer_get_daily_stats



    // we will also make custom endpoint for each function if ?function=timer_get_daily_stats&p1=today for instance

    // return Promise.resolve({ message: "hello user, you successfully logged in to custom backend api", params, bplugins });
    // return { message: "hello user, you successfully logged in to custom backend api", params };



    //
    //
    // PROTO 1 WORKING 
    //
    //
    // let urlToTest = "https://devd11111111111-3019-priv.websocial.cc/timer/timer.backend.js"
    // let evalRes = await getBackendApi().ressource.fetchEval(urlToTest, {}, { cache: false });
    // // let evalRes = ""
    // let fn1Code = evalRes["result"][0]["code"]


    // return new Promise<any>((resolve, reject) => {
    //     evalBackendCode(fn1Code, {custom:"paramhere"}, a => {
    //         // console.log(33333333, a)
    //         resolve({ message: "hello user, you successfully logged in to custom backend api, it managed to fetch plugins function backend code and exec it!", a });
    //     })
    // })

    // return new Promise<any>((resolve, reject) => {
    //     evalBackendCode(fn1Code, {custom:"paramhere"}, a => {
    //         // console.log(33333333, a)
    //         resolve({ message: "hello user, you successfully logged in to custom backend api, it managed to fetch plugins function backend code and exec it!", a });
    //     })
    // })

    //
    //
    // PROTO 2
    //
    //
    // let fnPluginsBack = await getBackendApi().plugins.getBackendFunctions();
    // return { message: "hello user, you successfully logged in to custom backend api", params, fnPluginsBack  };

    //
    //
    // PROTO 3
    //
    //
    // eval a fn
    let fnPluginsBack = await getBackendApi().plugins.getBackendFunctions();
    return new Promise<any>((resolve, reject) => {
        evalBackendCode(fnPluginsBack["timer_get_daily_stats"], {}, res => {
            // resolve(res);
            resolve({ message: "hello user, you successfully logged in to custom backend api and exec custom fn from plugin", res  });
        });
    });

    // return { message: "hello user, you successfully logged in to custom backend api", params, fnPluginsBack  };
};
