import { each } from "lodash";
import { processStringToMeta } from "../../../../shared/helpers/metas.helper";
import { toTimeStampInS } from "../../../../shared/helpers/timestamp.helper";
import { sharedConfig } from "../../../../shared/shared.config";
import { iFile, iFileMetas, metaContent } from "../../../../shared/types.shared";
import { getRelativePathFromSearchPath } from "./file.search.manager";
import { iFilesObj } from "./search-ripgrep.manager";

export interface iMetasFiles {
    [fileName:string]: iFileMetas
}

export const mergingMetaToFilesArr = (filesObj:iFilesObj, metasFiles: iMetasFiles):iFile[] => {
    const filesRes:iFile[] = []

     // merging meta dates into filesScannedObj
     each(metasFiles, (metasFile, fileName) => {
         if (filesObj[fileName]) {
             if (metasFile['created']) filesObj[fileName].created = toTimeStampInS(metasFile['created'])*1000
             if (metasFile['modified']) filesObj[fileName].modified = toTimeStampInS(metasFile['modified'])*1000
         }
    })

    // from Files obj to Files Arr
    each(filesObj, file => {
        filesRes.push(file)
    })

    return filesRes
}

export const processRawStringsToMetaObj = (rawMetasStrings: string[], folder:string, debugMode: boolean = false):iMetasFiles => {
    const res:iMetasFiles = {}

    // console.log('rawMetasStrings', rawMetasStrings)

    // PROCESS META FROM STRING TO iFileMetas
    let isIndexInsideHeader = false
    for (let i = 0; i < rawMetasStrings.length; i++) {
        let metaStr = rawMetasStrings[i];
        
        // filter on string
        metaStr = metaStr.split('\r').join('')
        if (metaStr === '') continue
        
        // filter on nb results
        const rawMetaArr2 = metaStr.split('.md:')
        if (rawMetaArr2.length < 2) continue

        
        const fileName = `${rawMetaArr2[0]}.md`;
        let cleanedFileName = getRelativePathFromSearchPath(fileName, folder)
        if (!res[cleanedFileName]) res[cleanedFileName] = {}

        const content = rawMetaArr2[1]
        const meta = processStringToMeta(content)
        
        if (meta && meta.name) res[cleanedFileName][meta.name] = meta.value
    }
    return res
}