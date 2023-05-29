import { exists } from "fs"
import { each, isString } from "lodash"
import { iApiDictionary } from "../../../shared/apiDictionary.type"
import { getDateObj } from "../../../shared/helpers/date.helper"
import { cleanPath, pathToIfile } from "../../../shared/helpers/filename.helper"
import { iDateObj, iFile } from "../../../shared/types.shared"
import { backConfig } from "../config.back"
import { formatDateHistory } from "./date.manager"
import { fileNameFromFilePath, scanDirForFiles } from "./dir.manager"
import { fileExists, moveFile, openFile, saveFile, upsertRecursivelyFolders } from "./fs.manager"
import { debounceCleanHistoryFolder } from "./history.manager"
import { perf } from "./performance.manager"

const p = {
    folder: ".history",
    infosFile: ".infos.md",
    housekeeping: {
        executionInterval: 24 * 60 * 60 * 1000, // one day
        keepOnePerDay_RuleTime: 1 * 30 * 24 * 60 * 60 * 1000, // after 1 month, keep on version/day
        keepOnePerWeek_RuleTime: 6 * 30 * 24 * 60 * 60 * 1000, // after 6 months , keep on version/week
    }
}
const h = `[FILE HISTORY]`


//
// NEW
//


export const createFileHistoryVersion = async (
    data:iApiDictionary["createHistoryFile"],
    date: iDateObj
) => {
    let histFile = getHistoryFile(data.filePath, date, data.historyFileType)
    await upsertRecursivelyFolders(histFile.path)
    await saveFile(histFile.path, data.content)

    // start the housekeeping process detached and abit later
    // otherwise will mess with tests
    setTimeout(() => {
        processFileHistoryHousekeeping(histFile, date)
    }, 1000)
}





// LOW LEVEL
const processFileHistoryHousekeeping = async (histFile:iFile, currDate:iDateObj) => {
    // if infosFile doesnt exists or timestamp > 1 days process
    const infosFilePath = `${histFile.folder}/${p.infosFile}`
    const infosExists = fileExists(infosFilePath)
    let shouldProceed = false 

    // should proceed?
    if (infosExists) {
        try {
            const infos = JSON.parse(await openFile(infosFilePath))
            if (
                !infos.lastrun || 
                currDate.num.timestamp >  infos.lastrun + p.housekeeping.executionInterval
                ) shouldProceed = true
        } catch (error) {
            shouldProceed = true
        }
    } else {
        shouldProceed = true
    }

    if (!shouldProceed) return
    // update the infosFile
    await saveFile(infosFilePath, JSON.stringify({lastrun: currDate.num.timestamp}))

    // get all files of the folder
    let resScan = await scanDirForFiles(histFile.folder)

    if (isString(resScan)) return console.log(h, resScan)
    // for each file
    each(resScan, f => {
        // dont take .infos
        if (f.filenameWithoutExt.startsWith(".")) return
        // get its date
        const fileArr = f.filenameWithoutExt.split("___")
        const dateFormated = fileArr[fileArr.length-1]
        const timestamp = getDateObj(dateFormated).num.timestamp
        fileArr.pop() // removing date
        const realFileName = fileArr.join("___") // only keep name
        const fDate = getDateObj(timestamp)
 
        if ( fDate.num.timestamp + p.housekeeping.keepOnePerWeek_RuleTime < currDate.num.timestamp ) {
            // if it is > 6 months, keep one per week
            // rename it "w3-03-2022.md"
            let newName = generateHistFilename(`${realFileName}`, fDate, "week")
            let newPath = `${f.folder}${newName}`
            moveFile(f.path, newPath)
        } else if ( fDate.num.timestamp + p.housekeeping.keepOnePerDay_RuleTime < currDate.num.timestamp ) {
            // if it is > 1 months, keep one per day
            // rename it "d31-03-2022"
            let newName = generateHistFilename(`${realFileName}`, fDate, "day")
            let newPath = `${f.folder}${newName}`
            moveFile(f.path, newPath)
        }
    })

}

const getHistoryFile = (filePath:string, date:iDateObj, action:string):iFile => {
    let file = pathToIfile(filePath)
    let histFileName = generateHistFilename(`${file.filenameWithoutExt}_${action}`, date, "full")
    let path = cleanPath(`${file.folder}/${p.folder}/${file.filenameWithoutExt}/${histFileName}`)
    let res = pathToIfile(path)
    return res
}
const generateHistFilename = (filename:string, date:iDateObj, dateType:"full"|"day"|"week") => {
    return `${filename}___${date.getCustomFormat(dateType)}.md`
}

//
// TEST export
//
export const TEST_fileHistory_internals = {
    getHistoryFile,
    processFileHistoryHousekeeping
}







//
// OLD
//


export const createFileHistoryVersion_OLD = async (data:iApiDictionary["createHistoryFile"]) => {
    let historyFolder = `${backConfig.dataFolder}/${backConfig.configFolder}/${backConfig.historyFolder}`
    let endPerf = perf('createHistoryFile ' + data.filePath)
    // IF path is inside history folder, do NOT BACKUP
    if (data.filePath.includes(historyFolder)) return

    // IF data.content contains --disable-history-- do NOT BACKUP
    const disableString = `--disable-history--`
    if (data.content.includes(disableString)) {
        console.log(`[HISTORY] "${disableString}" found in data.filepath, NO HISTORY`);
    } else {

        await upsertRecursivelyFolders(`${historyFolder}/`)

        // save history note
        let fileName = fileNameFromFilePath(data.filePath)
        fileName = `${formatDateHistory(new Date())}-${data.historyFileType}-${fileName}`
        await saveFile(`${historyFolder}/${fileName}`, data.content)

        // only keep up to x days of history files
        debounceCleanHistoryFolder()
        endPerf()
    }
}
