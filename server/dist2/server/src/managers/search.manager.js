"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeTerm = exports.retrieveCachedSearch = exports.cacheSearchResults = exports.liveSearch = void 0;
const config_back_1 = require("../config.back");
const dir_manager_1 = require("./dir.manager");
const fs_manager_1 = require("./fs.manager");
const execa = require('execa');
// export const search = async (term: string, folder:string):Promise<iFile[]|string> => {
//     return new Promise(async (resolve, reject) => {
//         let filesScanned:iFile[] = []
//         let processTerm = term.split('-').join('\\-') 
//         console.log({term, processTerm});
//         let answerApi = await exec2([
//             'rg', 
//             processTerm, 
//             backConfig.dataFolder+folder, 
//             '--count-matches',
//             // '--sortr',
//             // 'created',
//             '--type',
//             'md',
//         ]) as string
//         answerApi = answerApi.split(/\:[0-9]*/g).join('') 
//         answerApi = answerApi.split(`${backConfig.dataFolder+folder}\\`).join('') 
//         var array = answerApi.match(/[^\r\n]+/g);
//         answerApi = answerApi.split(`\\`).join('/') 
//         for (let i = 0; i < array.length; i++) {
//             let element = array[i];
//             element = element.split(`\\`).join('/') 
//             filesScanned.push({
//                 nature: 'file',
//                 name: `${folder}/${element}`,
//                 path: `${folder}/${element}`,
//             })
//         }
//         console.log(filesScanned);
//         resolve(filesScanned)
//     })
// }
var fs = require('fs');
exports.liveSearch = async (params) => {
    let processTerm = params.term.split('-').join('\\-');
    console.log({ params });
    const subprocess = execa.command([
        'rg',
        processTerm,
        config_back_1.backConfig.dataFolder + params.folder,
        '--count-matches',
        '--type',
        'md',
    ].join(' '));
    let processDataToFiles = (dataRaw) => {
        let res = [];
        dataRaw = dataRaw.split(/\:[0-9]*/g).join('');
        dataRaw = dataRaw.split(`${config_back_1.backConfig.dataFolder + params.folder}\\`).join('');
        dataRaw = dataRaw.split(`${config_back_1.backConfig.dataFolder + params.folder}/`).join('');
        var array = dataRaw.match(/[^\r\n]+/g);
        for (let i = 0; i < array.length; i++) {
            let element = array[i];
            element = element.split(`\\`).join('/');
            let stats = fs.lstatSync(`${config_back_1.backConfig.dataFolder}/${params.folder}/${element}`);
            filesScanned.push({
                nature: 'file',
                extension: 'md',
                index: i,
                created: Math.round(stats.birthtimeMs),
                modified: Math.round(stats.ctimeMs),
                // created: -1,
                // modified: -1,
                name: `${params.folder}/${element}`,
                realname: `${element}`,
                path: `${params.folder}/${element}`,
                folder: `${params.folder}`,
            });
        }
        return res;
    };
    let filesScanned = [];
    subprocess.stdout.on('data', dataRaw => {
        let data = dataRaw.toString();
        filesScanned.push(...processDataToFiles(data));
        console.log(`SEARCH => temporary search : ${filesScanned.length} elements found`);
        params.onSearchUpdate(filesScanned);
    });
    subprocess.stdout.on('close', dataRaw => {
        let data = dataRaw.toString();
        console.log(`SEARCH => search ENDED : ${filesScanned.length} elements found`);
        params.onSearchEnded(filesScanned);
    });
};
// export const search2 = async (term: string, folder:string):Promise<iFile[]|string> => {
//     return new Promise(async (resolve, reject) => {
//         let filesScanned:iFile[] = []
//         let processTerm = term.split('-').join('\\-') 
//         console.log({term, processTerm});
// let answerApi = await exec2([
//     'rg', 
//     processTerm, 
//     backConfig.dataFolder+folder, 
//     '--count-matches',
//     // '--sortr',
//     // 'created',
//     '--type',
//     'md',
// ]) as string
// answerApi = answerApi.split(/\:[0-9]*/g).join('') 
// answerApi = answerApi.split(`${backConfig.dataFolder+folder}\\`).join('') 
// var array = answerApi.match(/[^\r\n]+/g);
//     // answerApi = answerApi.split(`\\`).join('/') 
//     for (let i = 0; i < array.length; i++) {
//         let element = array[i];
//         element = element.split(`\\`).join('/') 
//         filesScanned.push({
//             nature: 'file',
//             name: `${folder}/${element}`,
//             path: `${folder}/${element}`,
//         })
//     }
//     console.log(filesScanned);
//     resolve(filesScanned)
// })
// }
exports.cacheSearchResults = async (term, results) => {
    let cachedFolder = `${config_back_1.backConfig.dataFolder}/${config_back_1.backConfig.configFolder}/.cached`;
    let searchFolder = `${cachedFolder}/search`;
    let searchResultsFile = `${searchFolder}/${term}`;
    if (!fs_manager_1.fileExists(cachedFolder))
        await dir_manager_1.createDir(cachedFolder);
    if (!fs_manager_1.fileExists(searchFolder))
        await dir_manager_1.createDir(searchFolder);
    await fs_manager_1.saveFile(searchResultsFile, JSON.stringify(results));
};
exports.retrieveCachedSearch = async (term) => {
    return new Promise(async (resolve, reject) => {
        // check if folders exists, otherwise create them
        let cachedFolder = `${config_back_1.backConfig.dataFolder}/${config_back_1.backConfig.configFolder}/.cached`;
        let searchFolder = `${cachedFolder}/search`;
        let searchResultsFile = `${searchFolder}/${term}`;
        if (!fs_manager_1.fileExists(cachedFolder))
            await dir_manager_1.createDir(cachedFolder);
        if (!fs_manager_1.fileExists(searchFolder))
            await dir_manager_1.createDir(searchFolder);
        if (fs_manager_1.fileExists(searchResultsFile)) {
            console.log(`[CACHE] cached search found for ${term}`);
            let rawContent = await fs_manager_1.openFile(searchResultsFile);
            let result = JSON.parse(rawContent);
            resolve(result);
        }
        else {
            console.log(`[CACHE] NO RESULT FOUND for ${term}`);
            resolve([]);
        }
    });
};
exports.analyzeTerm = (term) => {
    let res = { rawTerm: term, termId: term, term: term, folderToSearch: '' };
    let folderRaw = term.match(/\ \/([A-Za-z0-9\/\:\.\_\-\/\\\?\=\&\\ ]*)$/gm);
    // if folder
    if (folderRaw && folderRaw[0]) {
        res.term = term.replace(folderRaw[0], '');
        res.folderToSearch = folderRaw[0].substr(1);
    }
    res.termId = res.termId.replace('/', '');
    // res.termId = res.termId.replace('/', '').split('_').join('-')
    // res.term = res.term.split('_').join('-')
    return res;
};
