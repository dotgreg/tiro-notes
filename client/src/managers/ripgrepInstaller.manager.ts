import { iPlatform } from "../../../shared/types.shared"
import { getApi } from "../hooks/api/api.hook"
import { strings } from "./strings.manager"

export const startRipgrepInstallerProcess = (platform: iPlatform) => {
    getApi(api => {
        api.popup.prompt({
            title: "Ripgrep install required",
            text: "Tiro Notes requires the tool Ripgrep, which does not seem to be installed on your computer <br> Do you want Tiro to download and install it?", 
            onAccept: () => {
                api.userSettings.updateSetupJson("rg_path", "wooop")
                console.log(111, platform)
            }, 
            onRefuse: () => {
                console.log(222)

            }, 
            acceptLabelButton: "Install Ripgrep"
        })
    })
}