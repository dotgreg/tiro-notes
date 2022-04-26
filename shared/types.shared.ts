export type iFileNature = 'file' | 'folder'

export interface iLayout {
	notePath: string
	id: number
	x: number
	y: number
	w: number
	h: number
	minH: number
	maxH: number
}

export interface iTab {
	id: string
	name: string
	layout: iLayout[]
	position?: number
}

export interface iSetupForm {
	user: string
	password: string
	dataFolder: string
}

export interface iFilePreview {
	path: string
	picture?: string
	content: string
}
export interface iFile {
	nature: iFileNature
	name: string
	realname: string
	path: string
	extension?: string
	created?: number
	modified?: number
	index?: number
	folder: string
}

export type metaContent = string | number
export interface iFileMetas {
	[metaName: string]: metaContent
}

export interface iFileImage {
	file: iFile
	url: string
	title: string
	index?: number
}

export type iAppView = 'text' | 'image'
// export interface iImage {
//     url: string
//     title: string
// }


export interface iFolder {
	title: string
	key: string
	path: string
	hasChildren?: boolean
	children?: iFolder[]
}
export type iSetupCode =
	'ASK_SETUP' |
	'NO_CONFIG_FILE' |
	'NO_FOLDER' |
	'BAD_USER_PASSWORD' |
	'SUCCESS_CONFIG_CREATION' |
	'ERROR_CONFIG_CREATION'
