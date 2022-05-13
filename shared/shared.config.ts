import { sharedStrings } from './shared.strings'

export const sharedConfig = {
	// socketServerPort: 3001, 
	// frontendServerPort: 3001,
	// staticServerPort: 3001,
	tokenRefreshInHours: 24 * 4,

	path: {
		staticResources: 'static',
		defaultDataFolder: 'markdown-notes',
		configFolder: '.tiro',
		backendStateFolder: '.states',
		historyFolder: '.history',
		archiveFolder: '.history_archive',
		uploadFolder: '.resources',
		relativeUploadFolderName: '.resources',
	},

	metas: {
		headerStart: '=== HEADER ===',
		headerEnd: '=== END HEADER ==='
	},

	strings: sharedStrings,

	client: {
		log: {
			socket: true,
			eventManager: true,
			upload: false,
		},
		version: '0.30.2',
		params: {
			previewArea: {
				scrollSpeed: 1.3
			}
		}
	}
}
