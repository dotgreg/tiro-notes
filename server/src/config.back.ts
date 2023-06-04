import { sharedConfig } from '../../shared/shared.config';
import { getDataFolder, shouldAskForSetup, tryLoadJsonConfig } from "./managers/configSetup.manager"
import { fileExists } from './managers/fs.manager';
import { relativeToAbsolutePath } from './managers/path.manager';

// Get variables from env
export const getEnvVars = () => {
	const pe = process.env
	let https = pe.TIRO_HTTPS === 'true' ? true : false;
	let testing_env = pe.TIRO_TESTING_ENV === 'true' ? true : false;
	let port = pe.PORT ? parseInt(pe.PORT) : 3023;
	port = pe.TIRO_PORT ? parseInt(pe.TIRO_PORT) : port;
	let rgPath = pe.TIRO_RG_PATH ? pe.TIRO_RG_PATH : 'rg';
	return { pe, https, testing_env, port, rgPath }
}
// As we try to load JSON before config.back, we can only reference the tiro-config.json path to configSetup.manager.ts
const jsonConfig = tryLoadJsonConfig();


let { https, testing_env, port, rgPath } = getEnvVars()
// // Get variables from env
// const pe = process.env
// let https = pe.TIRO_HTTPS === 'true' ? true : false;
// let port = pe.PORT ? parseInt(pe.PORT) : 3023;
// port = pe.TIRO_PORT ? parseInt(pe.TIRO_PORT) : port;
// let rgPath = pe.TIRO_RG_PATH ? pe.TIRO_RG_PATH : 'rg';

// Get variables from tiro json config if it exists
if (jsonConfig) {
	if (jsonConfig.https) https = jsonConfig.https === 'true' ? true : false
	if (jsonConfig.port) port = parseInt(jsonConfig.port)
	if (jsonConfig.rg_path) rgPath = jsonConfig.rg_path
}

// LOADING CONFIG FILE
const dataFolder = getDataFolder()

// LOADING SHARED CONFIG
const dev = sharedConfig.dev
if (testing_env) dev.disableLogin = true

export const backConfig = {
	dataFolder,
	frontendBuildFolder: relativeToAbsolutePath('./client', true),

	dataFolderExists: fileExists(dataFolder),
	askForSetup: shouldAskForSetup(),
	sharedConfig,

	jsonConfig,
	port,
	https,
	rgPath,

	...sharedConfig.path,
	dev

}

