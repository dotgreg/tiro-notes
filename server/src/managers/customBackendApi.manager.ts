import { url } from "inspector";
import { backConfig } from "../config.back";
import {  getBackendApi } from "./backendApi.manager";
import { evalBackendCode } from "./eval.manager";
import { openFile } from "./fs.manager";
import { log } from "./log.manager";

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
    let h = `[CUSTOM BACKEND API] > `;

	// logic to trigger the custom backend API
    // check if api token is right
    let urlParams = params
    let urlParamsNoToken = { ...urlParams, token: undefined };
    let goodApiToken = backConfig.jsonConfig.customBackendApiToken;
    if (urlParams.token !== goodApiToken) {
        log(`${h} SECURITY ALERT!!!!!! invalid API token `, { urlParams });
        return Promise.resolve({ status: "error", result: "Invalid API token", apiToken: urlParams.token });
    }

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
                log(`${h} triggered backend function ${urlParams.function}`);
                resolve(res);
            }).catch(err => {
                log(`${h} triggered backend function ${urlParams.function} NOT FOUND`);
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
                evalBackendCode(fileContent, urlParams , res => {
                    if (res.status === "error") {
                        log(`${h} triggered endpoint file ${urlParams.file} NOT FOUND`);
                        resolve({ ...res , params:urlParams, available });
                    } else {
                        log(`${h} triggered endpoint file ${urlParams.file}`);
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
