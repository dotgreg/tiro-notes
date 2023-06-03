//
// SUPPORT FUNCTIONS
//
export const getTestingDataPath = () => {
	const homedir = require('os').homedir();
	const pathDataFolder = require('path').join(homedir, `/.tiro_testing_env_data_folder`)
	return pathDataFolder
}

const shouldLog = true
var fs = require('fs');
const deleteFolder = (path: string) => {
	const h = `[REMOVE FILE]`

	try {
		if (fs.existsSync(path)) {
			shouldLog && console.log(`${h} Deleting folder ${path}`)
			fs.rmSync(path, { recursive: true })
		} else {
			shouldLog && console.log(`${h} ${path} does not exists, do nothing`)
		}
	} catch (error) {
		shouldLog && console.log(); (`${h} Error removing ${path} : ${error.message}`);
		return error
	}
	return
}

const createFolder = (path: string) => {

	shouldLog && console.log(`[CREATEFOLDER] at ${path}`);
	fs.mkdirSync(path, (err) => {
		if (err) { shouldLog && console.log(`[CREATEFOLDER] Error ${err.message} (${path})`); }
		else { }
	});
}


//
// SCRIPT
//
const main = () => {
	console.log(`========== [TESTING PREP] START =========`)
	const pathDataFolder = getTestingDataPath()
	deleteFolder(pathDataFolder)
	createFolder(pathDataFolder)
	console.log(`[TESTING PREP] ${pathDataFolder} cleaned and ready`)
	console.log(`========== [TESTING PREP] END =========`)

}


main()
