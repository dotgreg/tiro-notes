import { cleanPath } from "../../../shared/helpers/filename.helper"
import { sharedConfig } from "../../../shared/shared.config"
import { getLoginToken } from "../hooks/app/loginToken.hook"
import { getBackendUrl } from "./sockets/socket.manager"

// const tokenParamStr = `?token=${p.loginToken}`
// 		const path = `${p.backendUrl}/static${getCachedRessourceFolder()}${p.getRessourceIdFromUrl(url)}${tokenParamStr}`
// 		return path

export const getStaticRessourceLink = (relPathLink:string) => {
    let localStaticPath = cleanPath(`${getBackendUrl()}/${sharedConfig.path.staticResources}/${relPathLink}?token=${getLoginToken()}`)
    return localStaticPath
}