import { iApiDictionary } from '../../../shared/apiDictionary.type';
import { sharedConfig } from '../../../shared/shared.config';
import { iTiroConfig } from '../../../shared/types.shared';
import { getEnvVars } from '../config.back';
import { fileExists, saveFile, upsertRecursivelyFolders, userHomePath } from './fs.manager';
import { log } from './log.manager';
import { hashPassword } from './password.manager';
import { p, relativeToAbsolutePath } from './path.manager';
import { getTestingEnvJsonConfig } from './testingEnv.manager';
var fs = require('fs')


/*
* PART 1 LOADING JSON CONFIG FILE
*/

// as we need to go down from sources-tiro/server/tiro-config.json to sources-tiro/tiro-config.json in dev mode
export const appConfigJsonPath = p(`${userHomePath()}/.tiro-config.json`);

// console.log(123123, appConfigJsonPath)




//
// READ JSON
//
let cachedJsonConfigLoadResult = null
export const tryLoadJsonConfig = () => {
	console.log(typeof getEnvVars);
	const { testing_env } = getEnvVars()
	if (testing_env) return getTestingEnvJsonConfig()
	if (cachedJsonConfigLoadResult) return cachedJsonConfigLoadResult as iTiroConfig

	if (fileExists(appConfigJsonPath)) {
		let res = JSON.parse(fs.readFileSync(appConfigJsonPath, 'utf8')) as iTiroConfig
		log('[JSON CONFIG] loaded successfully', { appConfigJsonPath, res });
		cachedJsonConfigLoadResult = res
		return res
	} else {
		log(`[JSON CONFIG] Json file not found at ${appConfigJsonPath}, ask frontend to display welcome screen`);
		return null
	}
}

export const getDataFolder = (): string => {
	const jsonConfig = tryLoadJsonConfig();
	return (jsonConfig && jsonConfig.dataFolder) ? relativeToAbsolutePath(jsonConfig.dataFolder) : ""
}


//
// ASK FOR SETUP?
//
export const shouldAskForSetup = () => {
	const jsonConfig = tryLoadJsonConfig();
	if (!jsonConfig || !jsonConfig.user || !jsonConfig.password || !jsonConfig.dataFolder) {
		log('[INIT SETUP] json doesnt exists, askForSetup!');
		return true
	}
	if (!fileExists(getDataFolder())) {
		log('[INIT SETUP] getDataFolder() doesnt exists, askForSetup!');
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
	if (!fileExists(data.form.dataFolder)) answer = { code: 'NO_FOLDER', message: `${sharedConfig.strings.setupForm.noFolder1} ${p(data.form.dataFolder)} ${sharedConfig.strings.setupForm.noFolder2}` }

	// if all good
	if (!answer || !answer.code) {
		// create json
		const newConfig: iTiroConfig = {
			user: data.form.user,
			password: await hashPassword(data.form.password),
			dataFolder: data.form.dataFolder,
		}
		saveSetupJson(newConfig)

		answer = { code: 'SUCCESS_CONFIG_CREATION' }
	}

	return answer
}



export const saveSetupJson = async (newConfig: iTiroConfig) => {
	await saveFile(appConfigJsonPath, JSON.stringify(newConfig))
}

export const updateSetupJsonParam = (name: string, value: string) => {
	// get json current infos in 
	let jsonObj = tryLoadJsonConfig()
	if (!jsonObj) return

	jsonObj[name] = value

	saveSetupJson(jsonObj)

}
