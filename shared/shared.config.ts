import { sharedStrings } from './shared.strings'
// THIRD LINE AUTOMATICALLY GENERATED, SHOULD ALWAYS BE THE THIRD LINE!
const version = "0.43.45";
// END OF AUTOMATICALLY GENERATED BLOCK

export const sharedConfig = {
	version,
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
			socket: false,
			verbose: false,
			fs: false,
			ripgrep: false,
		}
	},
	client: {
		log: {
			verbose: false,
			socket: false,
			upload: false,
			iframe: false,
			eventManager: false,
		},
		
	},

	dev: {
		disableLogin: false
	}

}
