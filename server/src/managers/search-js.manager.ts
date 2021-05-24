import { cleanPath, getFileInfos } from "../../../shared/helpers/filename.helper";
import { iFile } from "../../../shared/types.shared";
import { backConfig } from "../config.back";
import { normalizeString } from "../helpers/string.helper";
import { openFile } from "./fs.manager";
const klaw = require('klaw')


export const liveSearchJs = async (params:{
    term:string,
    folder:string, 
    titleSearch: boolean,


    onSearchUpdate: (filesScanned:iFile[]) => void,
    onSearchEnded: (filesScanned:iFile[]) => void
}):Promise<void> => {
    
    const {term, folder, titleSearch} = {... params}

    let startTime = new Date().getTime()
    let filesScanned:iFile[] = []
    const absolutePathFolder = backConfig.dataFolder + folder
    let count = 0
    let totCount = 0
    klaw(absolutePathFolder)
        .on('data', async (item) => {
            
            totCount++
            if (item.stats.isDirectory()) return

            let finfos = getFileInfos(item.path)
            let relativeFolder = finfos.folder.replace(backConfig.dataFolder, '')

            let isValid = false
            if (titleSearch) {
                // 1 title search
                if (normalizeString(finfos.filename).includes(normalizeString(term))) isValid = true
            } else {
                // 2 content search
                let filecontent = await openFile(item.path)
                isValid = normalizeString(filecontent).indexOf(normalizeString(term)) !== -1
            }

            if (isValid) {
                const file = createIFile(finfos.filename, relativeFolder, count, item.stats)
                filesScanned.push(file)
                count++
                console.log('[SEARCH-JS] found new item', item.path, item.stats.isDirectory() );
                params.onSearchUpdate(filesScanned)
            }
        })
        .on('end', () => {
            let timeSpent = new Date().getTime() - startTime
            console.log(`[SEARCH-JS] SEARCH ENDED in ${timeSpent}ms for ${totCount} elements`);
            params.onSearchEnded(filesScanned)
        }) 
}

export const createIFile = (name:string, folder:string, index:number, stats:any):iFile => {
    return {
        nature: 'file',
        extension: 'md',
        index,
        created: Math.round(stats.birthtimeMs),
        modified: Math.round(stats.ctimeMs),
        name: cleanPath(`${folder}/${name}`),
        realname: `${name}`,
        path: cleanPath(`${folder}/${name}`),
        folder: cleanPath(`${folder}`),
    }
}

// ripGrepStreamProcess.stdout.on('data', dataRaw => {
//     let data = dataRaw.toString()
//     console.log({data}, backConfig.dataFolder);
    
//     filesScanned.push(...processDataToFiles(data, params.titleSearch ? processTerm : ''))
//     console.log(`SEARCH => temporary search : ${filesScanned.length} elements found`);
//     params.onSearchUpdate(filesScanned)
// })
// ripGrepStreamProcess.stdout.on('close', dataRaw => {
//     let data = dataRaw.toString()
//     console.log(`SEARCH => search ENDED : ${filesScanned.length} elements found`);  
//     params.onSearchEnded(filesScanned)
// })