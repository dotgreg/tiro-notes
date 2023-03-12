import { iFile, iFolder } from "../../../shared/types.shared";

export const getFolderParentPath = (folder: iFolder): string => {
	return folder.path.substr(0, folder.path.length - (folder.title.length + 1))
}

export const getParentFolder = (path: string): string => {
	let folderArr = path.split("/")
	folderArr = folderArr.filter(f => f !== "")
	folderArr.pop()
	let folderParent = "/" + folderArr.join("/") + "/"
	folderParent = folderParent.replaceAll("//", "/")
	return folderParent
}
