import { iFolder } from "../../../shared/types.shared";
import { backConfig } from "../config.back";
import { scanDirForFoldersRecursive } from "./dir.manager";

export const triggerCustomBackendApi = (params) => {

	// logic to trigger the custom backend API
    // check if api token is right
    let goodApiToken = backConfig.jsonConfig.customBackendApiToken;
    if (params.token !== goodApiToken) {
        return { error: "Invalid API token" };
    }

    let folders: iFolder[] = []
    folders.push(scanDirForFoldersRecursive("/", 2))

    return { message: "hello user, you successfully logged in to custom backend api", params , folders};
};
