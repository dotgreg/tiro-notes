import { iApiDictionary } from "../../../shared/apiDictionary.type"
import { cleanPath, pathToIfile } from "../../../shared/helpers/filename.helper"
import { iFile } from "../../../shared/types.shared"
import { backConfig } from "../config.back"
import { formatDateHistory, iDateObj } from "./date.manager"
import { fileNameFromFilePath } from "./dir.manager"
import { saveFile, upsertRecursivelyFolders } from "./fs.manager"
import { debounceCleanHistoryFolder } from "./history.manager"
import { getFolderPath } from "./path.manager"
import { perf } from "./performance.manager"

export const fileHistoryParams = {
    folder: ".history"
}


//
// NEW
//
export const createFileHistoryVersion = async (
    data:iApiDictionary["createHistoryFile"],
    date: iDateObj
) => {
    let histFile = getHistoryFile(data.filePath, date, data.historyFileType)
    console.log(histFile.path, data.content)
    await upsertRecursivelyFolders(histFile.path)
    console.log(111)
    await saveFile(histFile.path, data.content)
    console.log(1113)
}


// LOW LEVEL
const getHistoryFile = (filePath:string, date:iDateObj, action:string):iFile => {
    let file = pathToIfile(filePath)
    let histFileName = `${file.filenameWithoutExt}_${date.full_file}_${action}.md`
    let path = cleanPath(`${file.folder}/${fileHistoryParams.folder}/${file.filenameWithoutExt}/${histFileName}`)
    let res = pathToIfile(path)
    return res
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

//
// TEST export
//
export const TEST_fileHistory_internals = {
    getHistoryFile
}