import { iFile } from "../../../shared/types.shared";

export const fileToNoteLink = (f:iFile, line?:string):string => {
    let lineStr = line ? `|${line}` : ``;
    return  `[link|${f.realname} ${f.folder}${lineStr}]\n`
}