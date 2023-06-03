import { iFile } from "../../../shared/types.shared";

export const fileToNoteLink = (f:iFile):string => {
    return  `[link|${f.realname} ${f.folder}]\n`
}