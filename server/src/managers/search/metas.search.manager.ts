import { each } from "lodash";
import { processStringToMeta } from "../../../../shared/helpers/metas.helper";
import { sharedConfig } from "../../../../shared/shared.config";
import { iFile, iFileMetas, metaContent } from "../../../../shared/types.shared";
import { cleanFilePath } from "./file.search.manager";
import { iFilesObj } from "./search.manager";

export interface iMetasFiles {
    [fileName:string]: iFileMetas
}

export const mergingMetaToFilesArr = (filesObj:iFilesObj, metasFiles: iMetasFiles):iFile[] => {
    const filesRes:iFile[] = []

     // merging meta dates into filesScannedObj
     each(metasFiles, (metasFile, fileName) => {
        if (metasFile['created']) filesObj[fileName].created = metasFile['created'] as number
        if (metasFile['modified']) filesObj[fileName].modified = metasFile['modified'] as number
    })

    // from Files obj to Files Arr
    each(filesObj, file => {
        filesRes.push(file)
    })

    return filesRes
}

export const processRawStringsToMetaObj = (rawMetasStrings: string[], folder:string):iMetasFiles => {
    const res:iMetasFiles = {}

    // PROCESS META FROM STRING TO iFileMetas
    let isIndexInsideHeader = false
    for (let i = 0; i < rawMetasStrings.length; i++) {
        let metaStr = rawMetasStrings[i];
        
        // filter on string
        metaStr = metaStr.split('\r').join('')
        if (metaStr === '') continue
        
        // filter on nb results
        const rawMetaArr2 = metaStr.split('.md:')
        if (rawMetaArr2.length < 1) continue
        
        const fileName = `${rawMetaArr2[0]}.md`;
        let cleanedFileName = cleanFilePath(fileName, folder)
        if (!res[cleanedFileName]) res[cleanedFileName] = {}

        const content = rawMetaArr2[1]
        const meta = processStringToMeta(content)
        
        if (meta) res[cleanedFileName][meta.name] = meta.value
    }
    return res
}