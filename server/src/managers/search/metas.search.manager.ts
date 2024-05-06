import { each } from "lodash";
import { processStringToMeta } from "../../../../shared/helpers/metas.helper";
import { toTimeStampInS } from "../../../../shared/helpers/timestamp.helper";
import { sharedConfig } from "../../../../shared/shared.config";
import { iFile, iFileMetas, metaContent } from "../../../../shared/types.shared";
import { getRelativePathFromSearchPath } from "./file.search.manager";
import { iFilesObj } from "./search-ripgrep.manager";
import { backConfig } from "../../config.back";
const fs = require('fs');
const path = require('path');


export interface iMetasFiles {
    [fileName:string]: iFileMetas
}


export const getMetaFromHeaderWithJs = async (file:iFile):Promise<iFile> => {
    // open file from its path
    const absPath = `${backConfig.dataFolder}/${file.path}`;
    try {

        const filePath = path.resolve(absPath);
        const buffer = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' });
        const lines = buffer.split('\n').slice(0, 4); // Get the first four lines
    
        let created = -1;
        let updated = -1;
    
        lines.forEach((line) => {
            if (line.includes('created:'))  created = parseInt(line.split(': ')[1]);
            if (line.includes('updated:')) updated = parseInt(line.split(': ')[1]);
        });
    
        if (created !== -1) created = toTimeStampInS(created)*1000
        if (updated !== -1) updated = toTimeStampInS(updated)*1000
    
        let finalModified = updated !== -1 ? updated : file.modified;
        let finalCreated = created !== -1 ? created : file.created;
        
        
        let nFile = { ...file, created: finalCreated, modified: finalModified};
        return nFile
    } catch (e) {
        console.log('[getMetaFromHeaderWithJs] Error while reading file', e)
        return file
    }
}

export const mergingMetaToFilesArr = (filesObj:iFilesObj, metasFiles: iMetasFiles):iFile[] => {
    const filesRes:iFile[] = []

     // merging meta dates into filesScannedObj
     each(metasFiles, (metasFile, fileName) => {
        // filename clean it using path
        fileName = path.basename(fileName)
         if (filesObj[fileName]) {
             if (metasFile['created']) filesObj[fileName].created = toTimeStampInS(metasFile['created'])*1000
             if (metasFile['modified']) filesObj[fileName].modified = toTimeStampInS(metasFile['modified'])*1000
             if (metasFile['updated']) filesObj[fileName].modified = toTimeStampInS(metasFile['updated'])*1000
            }
        // console.log(1111, fileName, filesObj[fileName], metasFile, metasFile['created'], metasFile['modified'], filesObj[fileName]?.created, filesObj[fileName]?.modified)
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
        
        // if meta['created'] is only 10 chars, add 000 at the end
        // if (meta && meta.value) meta.value = `${meta.value}`
        // if (meta && meta.name === "created" && `${meta.value}`.length === 10) meta.value = meta.value + "000"
        // if (meta && meta.name === "updated" && `${meta.value}`.length === 10) meta.value = meta.value + "000"
        
        // console.log('meta', meta)
        
        if (meta && meta.name) res[cleanedFileName][meta.name] = meta.value
    }
    return res
}