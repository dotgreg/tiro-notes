import { iFile } from "../../../shared/types.shared";
import { backConfig } from "../config.back";
import { exec2 } from "./exec.manager";

export const search = async (term: string):Promise<iFile[]|string> => {
    return new Promise(async (resolve, reject) => {
        let filesScanned:iFile[] = []
        // await exec2(['cd', backConfig.dataFolder])
        // let answerApi = await exec2(['ls', backConfig.dataFolder])
        let answerApi = await exec2(['rg', term, backConfig.dataFolder, '--count-matches']) as string
        // answerApi.split(/\r?\n/g);         
        // answerApi.split(/\r?\n/g);         
        // let answerApi = await exec2(['ls', backConfig.dataFolder])
        // console.log(answerApi.length);
        // console.log(answerApi);
        answerApi = answerApi.split(/\:[0-9]*/g).join('') 
        answerApi = answerApi.split(`${backConfig.dataFolder}\\`).join('') 
        // console.log(answerApi);
        var array = answerApi.match(/[^\r\n]+/g);
        // console.log(typeof(answerApi));
        // console.log(array.length);
        // console.log('DOOONE');
        for (let i = 0; i < array.length; i++) {
            const element = array[i];
            filesScanned.push({
                nature: 'file',
                name: element,
                path: element,
            })
        }
        console.log(filesScanned);
        resolve(filesScanned)
        
    })
}