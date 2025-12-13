import { url } from "inspector";
import { backConfig } from "../config.back";
import {  getBackendApi } from "./backendApi.manager";
import { evalBackendCode } from "./eval.manager";
import { openFile } from "./fs.manager";

////////////////////////////////
//
// CORE LOGIC SERVER
//
//
export type iCustomBackendApiAnswer = {
    status?: string;
    result?: string;
    params?: any;
    available?: any;
}

export const customBackendApiServer = async (params): Promise<iCustomBackendApiAnswer> => {

	// logic to trigger the custom backend API
    // check if api token is right
    let urlParams = params
    let goodApiToken = backConfig.jsonConfig.customBackendApiToken;
    if (urlParams.token !== goodApiToken) {
        return Promise.resolve({ status: "error", result: "Invalid API token" });
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
    // PROTO 1 >> OK 
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
    // PROTO 2 >> OK
    //
    //
    // let fnPluginsBack = await getBackendApi().plugins.getBackendFunctions();
    // return { message: "hello user, you successfully logged in to custom backend api", params, fnPluginsBack  };

    // //
    // //
    // // PROTO 3 >> OK
    // //
    // //
    // // eval a fn
    // let availablePluginBackendFunctions = await getBackendApi().plugins.getBackendFunctions();
    // return new Promise<any>((resolve, reject) => {
    //     // console.log("====================== START EXEC FN")
    //     // let codeFn = fnPluginsBack["timer_get_daily_stats"]['code']
    //     // evalBackendCode(codeFn, {params}, res => {
    //     //     // resolve(res);
    //     //     resolve({ message: "hello user, you successfully logged in to custom backend api and exec custom fn from plugin", result: res.result  });
    //     // });
    //     resolve({ok:true, availablePluginBackendFunctions})
    // });

    //
    //
    // PROTO 4 >> OK
    //
    //
    // eval a fn


    //remove token from urlParams
    urlParams.token = undefined;

    let availablePluginBackendFunctions = await getBackendApi().plugins.getBackendFunctions();
    let available = {availablePluginBackendFunctions, getBackendApi:getBackendApi()}
    return new Promise<iCustomBackendApiAnswer>(async (resolve, reject) => {

        //
        // PLUGIN FUNCTIONS CALL
        //
        // if urlParams function exists and it is inside fnPluginsBack
        if (urlParams.function ){
            getBackendApi().plugins.triggerBackendFunction(
                urlParams.function, 
                { params: urlParams }
            ).then(res => {
                resolve(res);
            }).catch(err => {
                resolve({ status: "error", result: "Function not found in backend plugins functions" + err , params:urlParams, available });
            });
        }

        //
        // FILE FUNCTIONS CALL
        //
        else if (urlParams.file) {
            let filePath = urlParams.file;
            
            const apiFolder =  `.tiro/custom_backend_api`
            const pathToFile = `${apiFolder}/${filePath}.md`;
            try {
                const fileContent = await openFile(pathToFile)
                evalBackendCode(fileContent, { params: urlParams }, res => {
                    if (res.status === "error") {
                        resolve({ ...res , params:urlParams, available });
                    } else {
                        resolve(res);
                    }
                });
            } catch (error) {
                resolve({ status: "error", result: `no file ${pathToFile} found`, params:urlParams, available });
            }


            // let codeFn = availablePluginBackendFunctions[filePath]?.code;
            // if (codeFn) {
            //     evalBackendCode(codeFn, { params: urlParams }, res => {
            //         resolve(res.result);
            //     });
            // } else {
            //     resolve({ status: "error", result: "File not found in backend plugins functions", params:urlParams, available });
            // }
        }


        else {
            resolve({ status: "error", result: `no valid "function" or "file" parameter found`, params:urlParams, available });
        }

    });
};
