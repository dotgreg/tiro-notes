import { iFile, iFileNature } from "../types.shared"

export const cleanPath = (path: string): string => {
	path = path.split('//').join('/')
	path = path.split('\\').join('/')
	path = path.split('//').join('/')
	return path
}
export const getFileInfos = (path: string): {
	path: string,
	folder: string,
	filename: string,
	filenameWithoutExt: string,
	extension: string
} => {

	let pathArr1 = path.split('/')
	let pathArr2 = path.split('\\')
	let pathArr = pathArr1.length > pathArr2.length ? pathArr1 : pathArr2

	let filename = pathArr[pathArr.length - 1]
	let extensionArr = filename.split('.')


	let folder = path.replace(filename, '')

	let extension = ''
	if (extensionArr.length > 1) extension = extensionArr[extensionArr.length - 1]

	let filenameWithoutExt = filename.replace(`.${extension}`, '')

	return { filename, extension, path, folder, filenameWithoutExt }
}

export const pathToIfile = (path: string): iFile => {
	let infos = getFileInfos(path)
	let nature: iFileNature = infos.extension ? "file" : "folder"
	let res: iFile = {
		path,
		realname: infos.filename,
		nature,
		name: infos.filename,
		extension: infos.extension,
		folder: infos.folder
	}
	return res

}

export const getFolderPath = (filename: string): string => {
	const d = filename.match(/(.*)[\/\\]/)
	var dirname = d ? d[1] + '/' : ''
	return cleanPath(dirname)
}

export const areSamePaths = (path1: string, path2: string): boolean => {
	return cleanPath(path1 + '/') === cleanPath(path2 + '/')
}
