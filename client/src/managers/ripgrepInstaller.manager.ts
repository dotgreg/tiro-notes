import { each } from "lodash-es"
import { cleanPath } from "../../../shared/helpers/filename.helper"
import { sharedConfig } from "../../../shared/shared.config"
import { iPlatform } from "../../../shared/types.shared"
import { getApi } from "../hooks/api/api.hook"
import { strings } from "./strings.manager"

const h = `[RIPGREP INSTALL]`

export const startRipgrepInstallerProcess = (platform: iPlatform) => {
    const baseDlPath = `https://github.com/dotgreg/tiro-notes/raw/master/platforms/electron/not-packaged/ripgrep/`
    const supportedInstalls = ["rg-darwin-arm", "rg-darwin-x64", "rg-darwin-x64", "rg-linux-x64", "rg-win-x64.exe"]
    let rgBinNameRequired = `rg-${platform.os}-${platform.arch}`
    if (platform.os === "win") rgBinNameRequired += ".exe"

    const isSupported = supportedInstalls.indexOf(rgBinNameRequired) !== -1

    let text = `Tiro Notes requires the tool Ripgrep, which does not seem to be installed on your computer`
    let acceptLabelButton = "Install Ripgrep"
    let onAccept = () => {}
    const notifId = `rg-install-notif`

    const upgradeBinRights = (internalPath:string, cb:Function) => {
        if(platform.os !== "win") {
            getApi(api => {
                const cmd = `chmod 0755 ${internalPath}`
                api.command.exec(cmd, res => {
                    console.log(`${h} -> cmd: ${cmd} : ${res}`)
                    cb(res)
                })
            })
        } else {
            cb()
        }
    }

    if (isSupported) {
        text += `<br>Do you want Tiro to download and install it? <br><br> The following version will be downloaded and installed: <br><code>${rgBinNameRequired}</code>`
        onAccept = () => {
            
            const dlUrl = `${baseDlPath}${rgBinNameRequired}`
            
            getApi(api => {
                api.config.get(conf => {
                    const destFolder = cleanPath(`${sharedConfig.path.configFolder}/bin/`)
                    const rgInternalPath = cleanPath(`${conf.dataFolder}/${destFolder}/${rgBinNameRequired}`) 
                    console.log(destFolder, rgInternalPath)

                    api.ui.notification.emit({id:notifId, content: `${h} downloading ripgrep...`, options:{hideAfter:-1}})
                    api.ressource.download(dlUrl, destFolder, () => {

                        api.ui.notification.emit({id:notifId, content: `${h} updating config...`, options:{hideAfter:-1}})
                        upgradeBinRights(rgInternalPath, () => {
                            api.userSettings.updateSetupJson("rg_path", rgInternalPath, (res) => {
                                api.ui.notification.emit({id:notifId, content: `${h} finished, restarting tiro notes...`, options:{hideAfter:10}})
                            }, {requiresServerRestart: true})
                        })

                    }, {fileName: rgBinNameRequired})
                })
            })
        }
    }


    if (!isSupported) {
        text += `
        <br><br>To install it, follow these instructions :<br> <a href="https://github.com/BurntSushi/ripgrep#installation">https://github.com/BurntSushi/ripgrep#installation</a> 
        <br> then restart Tiro`
        acceptLabelButton = "ok"
    }
    
    getApi(api => {
        api.popup.prompt({
            title: "Ripgrep install required",
            text, 
            onAccept, 
            onRefuse: () => {}, 
            acceptLabelButton
        })
    })
}