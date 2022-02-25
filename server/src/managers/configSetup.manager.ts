var path = require('path')
import { iApiDictionary } from '../../../shared/apiDictionary.type';
import { fileExists, saveFile } from './fs.manager';
import { hashPassword } from './password.manager';
import { p, relativeToAbsolutePath } from './path.manager';
var fs = require('fs')

// LOADING CONFIG FILE
export interface TiroConfig {
	user: string
	password: string
	dataFolder: string
	https?: string
	port?: string
}

/*
* PART 1 LOADING JSON CONFIG FILE
*/

// as we need to go down from sources-tiro/server/tiro-config.json to sources-tiro/tiro-config.json in dev mode
const isHeroku = process.env.PORT || false;

export const appConfigJsonPath = !isHeroku ? p(`../tiro-config.json`) : p(`../misc/heroku/tiro-heroku-config.json`);

let cachedJsonConfigLoadResult = null
export const tryLoadJsonConfig = () => {
	console.log('tryloadjsonconfig', appConfigJsonPath);
	if (cachedJsonConfigLoadResult) return cachedJsonConfigLoadResult as TiroConfig

	if (fileExists(appConfigJsonPath)) {
		let res = JSON.parse(fs.readFileSync(appConfigJsonPath, 'utf8')) as TiroConfig
		console.error('[JSON CONFIG] loaded successfully', { appConfigJsonPath, res });
		cachedJsonConfigLoadResult = res
		return res
	} else {
		console.error(`[JSON CONFIG] Json file not found at ${appConfigJsonPath}, ask frontend to display welcome screen`);
		return null
	}
}
export const getDataFolder = () => {
	const jsonConfig = tryLoadJsonConfig();
	return (jsonConfig && jsonConfig.dataFolder) ? relativeToAbsolutePath(jsonConfig.dataFolder) : undefined
}
export const shouldAskForSetup = () => {
	const jsonConfig = tryLoadJsonConfig();
	if (!jsonConfig || !jsonConfig.user || !jsonConfig.password || !jsonConfig.dataFolder) {
		console.log('[INIT SETUP] json doesnt exists, askForSetup!');
		return true
	}
	if (!fileExists(getDataFolder())) {
		console.log('[INIT SETUP] getDataFolder() doesnt exists, askForSetup!');
		return true
	}
	return false
}



export const processClientSetup = async (data: iApiDictionary['sendSetupInfos']): Promise<iApiDictionary['getSetupInfos']> => {
	let answer: iApiDictionary['getSetupInfos']

	// check if name is > 3 chars
	if (data.form.user.length < 3) answer = { code: 'BAD_USER_PASSWORD', message: 'user not valid' }

	// check if password is > 3 chars
	if (data.form.password.length < 3) answer = { code: 'BAD_USER_PASSWORD', message: 'password not valid' }

	// check if folder provided exists
	if (!fileExists(data.form.dataFolder)) answer = { code: 'NO_FOLDER', message: `folder path ${p(data.form.dataFolder)} doesnt exists` }

	// if all good
	if (!answer || !answer.code) {
		// create json
		const newConfig: TiroConfig = {
			user: data.form.user,
			password: await hashPassword(data.form.password),
			dataFolder: data.form.dataFolder,
		}
		await saveFile(appConfigJsonPath, JSON.stringify(newConfig))
		answer = { code: 'SUCCESS_CONFIG_CREATION' }
	}

	return answer
}
