export type iActivityField = "eventAction"|"eventName"| "url"| "type"| "ip"| "ua"
export type iActivityFilter= "file"| "time"|  "ip"
export interface iActivityReportParams {
    startDate?: string
    endDate?: string
    organizeBy?: iActivityFilter
    includes?: iActivityField[]
}
export interface iActivityReport {
    [referenceField:string]: {}
}

export type iNotificationType = "normal" | "warning" | "error"
export type iNotification = { 
	id?: string,
	content: string, 
	options?: {
		type?: iNotificationType, 
		hideAfter?: number, 
		keepInHistory?: boolean
	}
}

export type iPluginType = "background" | "bar" | "tag"
export type iPluginOptions = {
	background_exec_interval_in_min?: number
	disabled?: boolean
}
export type iPlugin = { name: string, type: iPluginType, code: string, options: iPluginOptions}

export type iSearchWordRes = { [filePath: string]: { file: iFile, results: string[] } }

export type iFileNature = 'file' | 'folder'

export type iViewType = 'editor' | 'editor-with-map' | 'both' | 'preview'

export type iFolderDeleteType =  "trash" | "cache" 

export interface iWindowContent {
	i: string
	file?: iFile
	active: boolean
	view: iViewType
}

export interface iWindow {
	i: string
	x: number
	y: number
	w: number
	h: number
	minH: number
	maxH: number
	refresh?: number
}
export interface iGrid {
	layout: iWindow[],
	content: iWindowContent[]
}

export interface iTab {
	id: string
	name: string
	active: boolean
	grid: iGrid,
	position?: number
	refresh?: number
	manualName?: boolean
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
	hasFolderChildren?: boolean
	children?: iFolder[]
}
export type iSetupCode =
	'ASK_SETUP' |
	'NO_CONFIG_FILE' |
	'NO_FOLDER' |
	'BAD_USER_PASSWORD' |
	'SUCCESS_CONFIG_CREATION' |
	'ERROR_CONFIG_CREATION'
