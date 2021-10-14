import { each } from "lodash";
import { regexs } from "../../../shared/helpers/regexs.helper";
import { processStringToMeta } from "../../../shared/helpers/metas.helper";
import { sharedConfig } from "../../../shared/shared.config";
import { iFileMetas } from "../../../shared/types.shared";

export interface fileMetaAndContent {metas: iFileMetas, content:string}
export const filterMetaFromFileContent = (fileContentWithMeta: string): fileMetaAndContent => {
    let matchs = fileContentWithMeta.match(regexs.metas)
    const metas:iFileMetas = {}

    // find metas
    if (matchs && matchs[0]) {
        const stringsArr = matchs[0].split('\n')
        for (let i = 0; i < stringsArr.length; i++) {
            const meta = processStringToMeta(stringsArr[i])
            if (meta) metas[meta.name] = meta.value
        }
    }

    //remove metas block from content
    const newContent = fileContentWithMeta.replaceAll(regexs.metas, '')

    
    return {
        metas,
        content: newContent
    }
}

export const metasObjToHeaderString = (metas: iFileMetas): string => {
    let res = `${sharedConfig.metas.headerStart}\n`
    each(metas, (metaContent, metaName) => {
        res += `${metaName}: ${metaContent}\n`
    }) 
    res += `${sharedConfig.metas.headerEnd}`
    return res
}