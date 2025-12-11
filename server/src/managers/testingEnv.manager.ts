import { iTiroConfig } from "../../../shared/types.shared";
import { getTestingDataPath} from "../../scripts/prepareTestingEnv.script";

export const setupTestingEnv = () => {


}


export const getTestingEnvJsonConfig = (): iTiroConfig => {

	// dataFolder is cleaned then recreated under the root user folder 
	// done asynced

	// await deleteFolder(pathDataFolder)
	// await createFolder(pathDataFolder)

	// user is test/ password test
	return {
		"user": "test",
		"password": "34da3782d9fcefaca610fa2c965766a6:51c84351eea5384c60be41b8b4869ae46f9f6c9911346d453dfc17cd6f2bdab09dd65f0d5bd1876a0f5808abc49ecf69a3386893f883534e75a6db227648fa9f",
		"dataFolder": getTestingDataPath(),
		"customBackendApiToken": "test"
	}
}
