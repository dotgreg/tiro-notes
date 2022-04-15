export const sharedStrings = {
	folders: 'Folders',
	files: 'files',
	images: 'images',
	trashNote: 'Are you sure to trash that note?',
	clickHereDisconnected: '(click here if persist)',
	searchingLabel: 'searching...',
	lastNotes: 'Last Notes',
	newNote: 'New Note',
	dateModified: 'Modified :',
	dateCreated: 'Created :',
	searchPlaceholder: 'Search Note',
	hoursAgo: ' hours ago',
	daysAgo: ' days ago',
	minsAgo: ' mins ago',
	months: ["January", "February", "March", "April", "May", "June",
		"July", "August", "September", "October", "November", "December"
	],
	createFolder: 'Create folder',
	createFolderPrompt: 'New Folder name to create in',
	renameFolder: 'Rename folder',
	renameFolderPrompt: 'Rename folder to :',
	deleteFolder: 'Delete folder',
	deleteFolderPrompt: 'Are you sure you want to delete the folder and all its notes (no recovery possible) : ',
	moveToTrash: 'Move to trash',
	moveToTrashPrompt: 'Are you sure you want move folder in .tiro/.trash : ',
	loadingFolder: 'loading...',
	moveFolderPrompt: 'move folder',
	setupForm: {
		title: "Login to Tiro",
		introText: `Welcome to Tiro, please fill these informations to get started`,
		user: 'user',
		password: 'password',
		dataFolder: 'folder path',
		userExplanation: 'should have > 3 chars',
		passwordExplanation: 'should have > 3 chars',
		folderExplanation: `relative from Tiro folder installation (../data for example)`,
		successReload: `Configuration file successfully written, reloading application...`,
		submit: 'login',
		noFolder1: 'folder path',
		noFolder2: 'doesn\'t exists, please create it or choose another folder (no data will be deleted).',
	},
	appviews: {
		image: 'Switch to Gallery View',
		text: 'Switch to Files View',
	},
	loginForm: {
		wrongUserPassword: 'Wrong login/password',
		wrongToken: 'Authentication expired, please log again'
	},
	passwordForm: {
		explanation: "please enter your password",
		submit: 'submit'
	},
	editorBar: {
		tts: 'Text to speech',
		explanation: {
			history: 'File history'
		},
		lightbox: 'Show Images in Slider'
	},
	ttsPopup: {
		title: 'Text to speech',
		voice: 'Voice',
	},
	settingsPopup: {
		title: 'Tiro Settings',
		backend: {
			title: 'Server settings',
			explanation: 'Only fill if server is on another port/protocol than the client (usually in development)',
			protocol: 'Https',
			protocolExpl: 'https or http',
			port: 'Port',
			portExpl: 'Port used by backend (ex: 3023)',
		}
	},
	historyPopup: {
		title: 'Versions for ',
		thead: {
			date: 'date',
			name: 'version'
		}
	},
	rgNotWorking: 'ERROR: Tiro requires Ripgrep to be working, it seems that ripgrep (rg command) is either not installed or not functionning correctly on you computer. To install it, follow these instructions : https://github.com/BurntSushi/ripgrep#installation',
	promptPopup: {
		defaultTitle: `User Prompt`,
		confirmTitle: `Confirm`,
		accept: `Ok`,
		refuse: `Cancel`,
	}

}
