import fs from 'fs/promises'
const p = require('path');

//
// SUPPORT FUNCTIONS
//
export const getTestingDataPath = () => {
	const homedir = require('os').homedir();
	const pathDataFolder = require('path').join(homedir, `/.tiro_testing_env_data_folder`)
	return pathDataFolder
}

const shouldLog = true
// var fs = require('fs');
const deleteFolder = async (path: string) => {
	const h = `[REMOVE FILE]`

	try {
		shouldLog && console.log(`${h} Deleting folder ${path}`)
		await fs.rm(path, { recursive: true })
	} catch (error) {
		shouldLog && console.log(); (`${h} Error removing ${path} : ${error.message}`);
		return error
	}
	return
}

const createFolder = async (path: string) => {

	shouldLog && console.log(`[CREATEFOLDER] at ${path}`);
	try {
		await fs.mkdir(path);
	} catch (e) {
		console.log(3339, e)
	}
}


//
// SCRIPT
//
const main = async () => {
	console.log(`========== [TESTING PREP] START =========`)
	const pathDataFolder = getTestingDataPath()
	await deleteFolder(pathDataFolder)
	await createFolder(pathDataFolder)
	console.log(`[TESTING PREP] ${pathDataFolder} cleaned and ready`)
	console.log(`========== [TESTING PREP] END =========`)
	await new Promise(resolve => setTimeout(resolve, 1000));

}


main()
