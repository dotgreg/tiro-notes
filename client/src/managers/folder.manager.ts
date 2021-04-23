import { iFolder } from "../../../shared/types.shared";

export const getFolderParentPath = (folder:iFolder):string => {
    return folder.path.substr(0,folder.path.length - (folder.title.length+1))
}