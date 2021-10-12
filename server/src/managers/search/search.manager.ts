import { each } from "lodash";
import { regexs } from "../../../../shared/helpers/regexs.helper";
import { sharedConfig } from "../../../../shared/shared.config";
import { iFile } from "../../../../shared/types.shared";
import { backConfig } from "../../config.back";
import { processRawDataToFiles, processRawPathToFile } from "./file.search.manager";
import { iMetasFiles, mergingMetaToFilesArr, processRawStringsToMetaObj } from "./metas.search.manager";
const execa = require('execa');

export interface iFilesObj {[filePath:string]: iFile}

var fs = require('fs')
export const liveSearchRipGrep = async (params:{
    term:string, 
    folder:string, 
    titleSearch: boolean,
    recursive: boolean,

    onSearchUpdate: (filesScanned:iFile[], initial: boolean) => Promise<void>,
    onSearchEnded: (filesScanned:iFile[]) => Promise<void>
}):Promise<void> => {

    let processTerm = params.term.split('-').join('\\-') 
    const folderToSearch = `${backConfig.dataFolder+params.folder}`;
    const perfs = {init: Date.now(), cmd1: Date.now(), cmd2:Date.now()}
    const searchType = (params.term === '') ? 'folder' : 'term'
    
    // const paramsCmd1 = (params.titleSearch || params.term === '') ? fullFolderSearchParams : normalSearchParams
    // const paramsCmd2 = searchType === 'folder' ? metaFilesInFullFolderSearch : metaFilesInFullFolderSearch

    // regex dictionary
    const r = {
        all: '[\\d\\D]*',
        headerStart: sharedConfig.metas.headerStart,
        headerStop: sharedConfig.metas.headerEnd,
    }
    
    //////////////////////////////////////
    // PROCESS SEARCH 1 : TERM SEARCH
    //
    if (searchType === 'term') {
        const termRegex  = `(${r.headerStart}${r.all}${r.headerStop})*${r.all}${processTerm}${r.all}(${r.headerStart}${r.all}${r.headerStop})*`
        const normalSearchParams = [
            termRegex, 
            folderToSearch, 
            '--ignore-case',
            '--type',
            'md',
            '--multiline',
        ]

        const titleFilter = params.titleSearch ? processTerm : ''

        let resultsRawArr:string[] = []
        const ripGrepStreamProcess1 = execa('rg', normalSearchParams)
        ripGrepStreamProcess1.stdout.on('data', async dataRaw => {
            const rawMetaString = dataRaw.toString()
            // split multiline strings
            const rawMetaArr = rawMetaString.split('\n')
            resultsRawArr.push(...rawMetaArr)
        })
        ripGrepStreamProcess1.stdout.on('close', dataRaw => {
            const metasFilesObj = processRawStringsToMetaObj(resultsRawArr, params.folder);
            const scannedFilesObj:iFilesObj = {}
            let index = 0
            each(metasFilesObj, (metaObj, fileName) => {
                const file = processRawPathToFile(fileName, index, titleFilter, params.folder)
                scannedFilesObj[file.name] = file
                index++
            })
            const filesWithMetaUpdated = mergingMetaToFilesArr(scannedFilesObj, metasFilesObj)
            console.log(`[RIPGREP SEARCH] FOLDER => CMD2 => ENDED `,{ files: filesWithMetaUpdated.length, metasFilesObj, normalSearchParams});  
            params.onSearchEnded(filesWithMetaUpdated)
        })
    }

    //////////////////////////////////////
    // PROCESS SEARCH 2 : FOLDER SEARCH
    //
    else if (searchType === 'folder') {
        const fullFolderSearchParams = [
            '--files',
            folderToSearch,
            '--max-depth=1',
            '--type',
            'md', 
        ]
    
        const metaFilesInFullFolderSearch = [
            `${r.headerStart}${r.all}${r.headerStop}`,
            folderToSearch,
            '--max-depth=1',
            '--type',
            'md', 
            '--multiline', 
        ]

        // PROCESS 1
        const ripGrepStreamProcess1 = execa('rg', fullFolderSearchParams)
        // const filesScanned:iFile[] = []
        const filesScannedObj:iFilesObj = {}
        ripGrepStreamProcess1.stdout.on('data', async dataRaw => {
            let data = dataRaw.toString()
            const files = processRawDataToFiles(data, params.titleSearch ? processTerm : '', params.folder)
            // filesScanned.push(...files)
            each(files, file => {
                filesScannedObj[file.name] = file
            })
            // DISABLING UPDATE SEARCH AS CREATES pb ON FRONT
            // await params.onSearchUpdate(filesScanned, false)
        })
        ripGrepStreamProcess1.stdout.on('close', dataRaw => {
            console.log(`[RIPGREP SEARCH] FOLDER => CMD1 => ENDED : ${filesScannedObj.length} elements found`, {fullFolderSearchParams});  
            perfs.cmd1 = Date.now()
            triggerAggregationIfEnded()
            // params.onSearchEnded(filesScanned)
        })
    
        // PROCESS 2
        const ripGrepStreamProcess2 = execa('rg', metaFilesInFullFolderSearch)
        const rawMetasStrings:string[] = []
        let metasFilesScanned:iMetasFiles = {}
        ripGrepStreamProcess2.stdout.on('data', async dataRaw => {
            const rawMetaString = dataRaw.toString()
            // split multiline strings
            const rawMetaArr = rawMetaString.split('\n')
            rawMetasStrings.push(...rawMetaArr)
        })
        ripGrepStreamProcess2.stdout.on('close', dataRaw => {
            // process raw strings to meta objs
            metasFilesScanned = processRawStringsToMetaObj(rawMetasStrings, params.folder)
            console.log(`[RIPGREP SEARCH] FOLDER => CMD2 => ENDED `,{metaFilesInFullFolderSearch});  
            perfs.cmd2 = Date.now()
            triggerAggregationIfEnded()
        })
    
        // PROCESS 3 : AGGREGATE RESULTS WHEN BOTH CMDS ARE DONE
        let counterCmdsDone = 0
        const triggerAggregationIfEnded = () => {
            counterCmdsDone++
            if (counterCmdsDone === 2) {
                const filesWithMetaUpdated = mergingMetaToFilesArr(filesScannedObj, metasFilesScanned)
                const perfString = `tot:${Date.now() - perfs.init}ms / cmd1:${perfs.cmd1 - perfs.init}ms / cmd2:${perfs.cmd2 - perfs.init}ms`
                console.log(`[RIPGREP SEARCH] FOLDER => BOTH CMDS => ENDED `, {files: filesWithMetaUpdated.length, metasFilesScanned, perfString, perfs});  
                params.onSearchEnded(filesWithMetaUpdated)
            }
        }
    }




}








export const analyzeTerm = (term:string):{
    rawTerm:string, 
    termId:string, 
    term:string, 
    folderToSearch:string,
    titleSearch: boolean
} => {
    let res = {rawTerm:term, termId:term, term:term, folderToSearch:'', titleSearch:false}

    // if only folder, term = ''
    let folderRaw1 = term.match(regexs.searchFolderNoSpace)
    if (folderRaw1 && folderRaw1[0]) {
        res.term = ''
        res.folderToSearch = folderRaw1[0]
    }

    // if folder in 'toto /hello/world'
    let folderRaw2 = term.match(regexs.searchFolder)
    if (folderRaw2 && folderRaw2[0]) {
        res.term = term.replace(folderRaw2[0], '')
        res.folderToSearch = folderRaw2[0].substr(1)
    }

    // if search term is intitle:toto, only search in title
    if (res.term.startsWith('intitle:')) {
        res.titleSearch = true
        res.term = res.term.replace('intitle:', '')
    }

    res.termId = res.termId.replace('/', '')
    
    return res
}