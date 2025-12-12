import { backConfig } from "../config.back";
import {  getBackendApi } from "./backendApi.manager";

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



    // let fnPluginsBack = await getBackendApi().plugins.getBackendFunctions();
    let urlToTest = "https://devd11111111111-3019-priv.websocial.cc/timer/timer.backend.js"
    let evalRes = await getBackendApi().ressource.fetchEval(urlToTest);


    return { message: "hello user, you successfully logged in to custom backend api", params, evalRes };
};
