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
		cacheFolder: 'cache',
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

	server: {
		log: {
			socket: true,
			verbose: true,
			fs: true,
			ripgrep: true,
		}
	},
	client: {
		log: {
			verbose: true,
			socket: true,
			upload: true,
			iframe: true,
			eventManager: true,
		},
		version: '0.30.95',
		params: {
			previewArea: {
				scrollSpeed: 1.3
			}
		}
	},

	dev: {
		disableLogin: false
	}

}
