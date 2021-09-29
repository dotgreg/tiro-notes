import { exists, existsSync } from "fs";
import { debounce, throttle } from "lodash";
import { cleanPath, getFileInfos } from "../../../shared/helpers/filename.helper";
import { iFile } from "../../../shared/types.shared";
import { backConfig } from "../config.back";
import { normalizeString } from "../helpers/string.helper";
import { dirDefaultBlacklist } from "./dir.manager";
import { fileExists, fileStats, isDir, openFile } from "./fs.manager";
import { anyToRelPath, p } from "./path.manager";

const klaw = require('klaw')
const through2 = require('through2')
const path = require('path')
const fs = require('fs')

const blockLength = 1000

let walkRec = (p:{
    dir:string, 
    taskQueue, 
    recursive:boolean
    onFile:(file:{path:string, stats:any}) => void , 
    onBlockEnd: Function, 
    onError:Function
}) => {
    // const {dir, onFile, onError}
    const folderItems = fs.readdirSync(p.dir)
	folderItems.forEach((item, i) => {

        if (p.taskQueue.length % blockLength === 0) {
            // every 1000 scan, do intermediary send
            console.log('add step at ', i);
            p.taskQueue.push(async () => { 
                await p.onBlockEnd() 
            })
        }
        p.taskQueue.push(async () => { 
            let itemPath = path.join(p.dir, item)
            let stats
            try {
                const basename = path.basename(itemPath)
                const isHiddenFile = basename[0] === '.'
                const isBlacklisted = dirDefaultBlacklist.indexOf(basename) !== -1
                if (isBlacklisted) console.log(basename);
                
                if (!isHiddenFile && !isBlacklisted) {
                    stats = fs.statSync(itemPath)
                }
            } catch (e) {
                p.onError(e)
                return
            }


            if (!stats) return
            if (p.recursive && stats.isDirectory()) {
                let p2 = {...p}
                p2.dir = itemPath
                await walkRec(p2)
            }
            else if (stats.isFile()) {
                const isMdFile = itemPath.toLowerCase().endsWith('.md')
                if (!isMdFile) return
                await p.onFile({path:itemPath, stats: stats})
            }
        })
	})
}

export const liveSearchJs = async (params:{
    term:string,
    folder:string, 
    titleSearch: boolean,
    recursive: boolean,


    onSearchUpdate: (filesScanned:iFile[], initial: boolean) => Promise<void>,
    onSearchEnded: (filesScanned:iFile[]) => Promise<void>
}):Promise<void> => {
    
    const {term, folder, titleSearch} = {... params}

    let startTime = new Date().getTime()
    let filesScanned:iFile[] = []
    let errors:string[] = []
    const absolutePathFolder = backConfig.dataFolder + folder
    let count = 0
    let totCount = 0

    if (!fileExists(absolutePathFolder)) return console.log(`[SEARCH-JS] path ${absolutePathFolder} doesnt exists, stop search`)

    const taskQueue = []
    let lastFilesScannedCount = 0
    walkRec({
        dir: absolutePathFolder,
        recursive: params.recursive,
        taskQueue,
        onBlockEnd: async () => {
            let timeSpent = new Date().getTime() - startTime
            console.log(`[SEARCH-JS] search update for ${absolutePathFolder} in ${timeSpent}ms for ${totCount} elements with ${errors.length} errors`)
            await params.onSearchUpdate(filesScanned.slice(filesScanned.length - blockLength), false)
        },
        onFile: async item => {
            totCount++
            let finfos = getFileInfos(item.path)
            let relativeFolder = finfos.folder.replace(backConfig.dataFolder, '')

            let isValid = false

            // 0 if no term, valid
            if (term === '') {
                isValid = true
            }

            // 1 title search for everybody
            if (!isValid  && normalizeString(finfos.filename).includes(normalizeString(term))) isValid = true

            
            // 2 content search => only if title search is false
            if (!titleSearch && !isValid) {
                let filecontent = await openFile(item.path)
                isValid = normalizeString(filecontent).indexOf(normalizeString(term)) !== -1
            }

            if (isValid) {
                const file = createIFile(finfos.filename, relativeFolder, count, item.stats)
                filesScanned.push(file)
                count++
            }
        },
        onError: e => {
            errors.push(e)
        }
    })
    console.log(`[SEARCHJS] exec queue length: ${taskQueue.length}`);
    
    for (let i = 0; i < taskQueue.length; i++) {
        // initial cleanup
        if (i === 0) params.onSearchUpdate([], true)
        
        // process task
        if (!taskQueue[i]) return
        await taskQueue[i]();
        
        // show early result asap
        // if (filesScanned.length === 10) await params.onSearchUpdate(filesScanned, false)
        // if (filesScanned.length === 30) await params.onSearchUpdate(filesScanned, false)
        
        // show definitive result
        if (i === taskQueue.length - 1) {
            let timeSpent = new Date().getTime() - startTime
            console.log(`[SEARCH-JS] SEARCH ENDED for ${absolutePathFolder} in ${timeSpent}ms for ${totCount} elements with ${errors.length} errors`);
            params.onSearchEnded(filesScanned)
        }
    }
}

export const createIFile = (name:string, folder:string, index:number, stats:any):iFile => {
    folder = anyToRelPath(folder)
    // console.log(333, folder);
    
    return {
        nature: 'file',
        extension: 'md',
        index,
        created: Math.round(stats.birthtimeMs),
        modified: Math.round(stats.ctimeMs),
        name: cleanPath(`${name}`),
        realname: `${name}`,
        path: cleanPath(`${folder}/${name}`),
        folder: cleanPath(`${folder}`),
    }
}
