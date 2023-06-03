import { iUserSettingList, iUserSettingName, iUserSettingObj } from "../../../shared/types.shared";
import { backConfig } from "../config.back";
import { openFile } from "./fs.manager";

export const getUserSettings = async ():Promise<iUserSettingObj> => {
    const fileSettingsPath = `${backConfig.dataFolder}/${backConfig.configFolder}/${backConfig.backendStateFolder}/user-settings.md`
    try {
        let str = await openFile(fileSettingsPath)
        let obj = JSON.parse(str) as iUserSettingObj
        return obj
    } catch (error) {
        console.log(`getUserSettings error:`, error)
        return null
    }
}

