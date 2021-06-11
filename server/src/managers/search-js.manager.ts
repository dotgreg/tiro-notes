import { exists, existsSync } from "fs";
import { cleanPath, getFileInfos } from "../../../shared/helpers/filename.helper";
import { iFile } from "../../../shared/types.shared";
import { backConfig } from "../config.back";
import { normalizeString } from "../helpers/string.helper";
import { isDir, openFile } from "./fs.manager";

const klaw = require('klaw')
const through2 = require('through2')
const path = require('path')


const searchFilter = item => {
    const basename = path.basename(item)
    const isADir = isDir(item)
    const isHiddenFile = basename[0] === '.'
    
    let res = true
    if (isADir) {
        // DIR RULES
        res = !isHiddenFile
    } else {
        // FILE RULES
        const isMdFile = basename.toLowerCase().endsWith('.md')
        res = !isHiddenFile && isMdFile
    }
    return res 
}

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

    if (!existsSync(absolutePathFolder)) return console.log(`[SEARCH-JS] path ${absolutePathFolder} doesnt exists, stop search`)

    klaw(absolutePathFolder, {filter: searchFilter})
        .on('data', async (item) => {
            
            totCount++
            // if (item.stats.isDirectory()) return

            let finfos = getFileInfos(item.path)
            let relativeFolder = finfos.folder.replace(backConfig.dataFolder, '')

            let isValid = false

            // 1 title search for everybody
            if (normalizeString(finfos.filename).includes(normalizeString(term))) isValid = true
            
            // 2 content search => only if title search is false
            if (!titleSearch && !isValid) {
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