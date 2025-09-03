import { iFile, iFileNature } from "../types.shared"

export const cleanPath = (path: string): string => {
	path = path.split('://').join('__HTTP__SEP')

	path = path.split('//').join('/')
	path = path.split('\\').join('/')
	path = path.split('//').join('/')

	path = path.split('__HTTP__SEP').join('://')

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

	// if path does not start by / , we add it
	// if (path.includes('d3') && path[0] !== '/') console.log('getFileInfos', { path, folder, filename, extension, filenameWithoutExt })
	if (path[0] !== '/') path = '/' + path
	if (folder[0] !== '/') folder = '/' + folder

	return { filename, extension, path, folder, filenameWithoutExt }
}

export const pathToIfile = (path: string): iFile => {
	let infos = getFileInfos(path)
	let nature: iFileNature = infos.extension ? "file" : "folder"
	let res: iFile = {
		path:infos.path,
		realname: infos.filename,
		nature,
		name: infos.filename,
		extension: infos.extension,
		folder: infos.folder,
		filenameWithoutExt: infos.filenameWithoutExt
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

// replace everything non a-A-z-Z-0-9 by a _
export const cleanString = (str: string): string => {
	return str.replace(/[^a-zA-Z0-9]/g, '_')
}