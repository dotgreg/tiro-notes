import { getDateObj } from "./helpers/date.helper"

export type iActivityField = "eventAction"|"eventName"| "url"| "type"| "ip"| "ua"|"weight"
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
export type iActivityLog = {
    eventName:string, eventAction:string, ip:string, ua:string, appUrl:string
}

export type iCommandStreamChunk = {
	text:string
	textTot:string 
	index: number
	isLast:boolean
	isError?: boolean 
}

export interface iTiroConfig {
	[name: string]: string | undefined
	user: string
	password: string
	dataFolder: string
	https?: string
	port?: string
	rg_path?: string
}

export type iBackConfig = {
	dataFolder:string
	frontendBuildFolder:string

	dataFolderExists:boolean
	askForSetup:boolean
	sharedConfig: any

	jsonConfig: iTiroConfig | null
	port:number
	https:boolean 
	rgPath:string

	[name: string]: any
}

export type iDateObj = ReturnType<typeof getDateObj>

export type iNotificationType = "normal" | "warning" | "error"
export type iNotification = { 
	id?: string,
	content: string, 
	options?: {
		type?: iNotificationType, 
		hideAfter?: number, 
		showOnceEvery?: number
		keepInHistory?: boolean,
	}
}

export type iUserSettingList = { key: iUserSettingName, val: any }[]
export type iUserSettingObj = {[K in iUserSettingName]:any}
export type iUserSettingName =
'ui_filesList_sortMode' |
'ui_layout_colors_main' |
'ui_layout_shortcuts_panel' |
'ui_sidebar' |

'ui_editor_links_as_button' |
'ui_editor_links_preview_zoom' |
'ui_editor_markdown_preview' |
'ui_editor_markdown_enhanced_preview' |
'ui_editor_markdown_latex_preview' |
'ui_editor_markdown_table_preview' |
'ui_editor_ai_command' |
'ui_editor_ai_text_selection' |

'users_viewer_user_enable' |
'users_viewer_user_password' |

'server_activity_logging_enable' |
'view_disable_notification_popups' |
'plugins_marketplace_url' |

'demo_mode_enable' |

'export_pandoc_cli_options' |

'ui_other'

export type iPluginType = "background" | "bar" | "tag"
export type iPluginOptions = {
	background_exec_interval_in_min?: number
	disabled?: boolean
}

export type iPlatform = {
    os: string,
    arch: string
}

export type iPlugin = { name: string, type: iPluginType, code: string, options: iPluginOptions}

// export type iSearchWordRes = { [filePath: string]: { file: iFile, results: string[], resultsPos:{line:number, position:number}[] } } // RG does not return the line pos here...
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
	filenameWithoutExt?: string
	stats?:any
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

	export type iUpdateConfigJsonOpts = {
		requiresServerRestart?: boolean
	}
	export type iDownloadRessourceOpts = {
		fileName?: string
	}