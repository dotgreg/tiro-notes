import isBoolean from "lodash-es/isBoolean"
import { getApi } from "../hooks/api/api.hook"

export const ifNoFolders_triggerDemoDownload = () => {
    getApi(api => {
        api.folders.get(["/"], r => {
            let rootFolders = r.folders[0]["children"]
            if (rootFolders && rootFolders.length < 2) {
                api.userSettings.triggerDemoDownload()
            }
        }, {depth:-1})
    })
}

export const triggerDemoDownload = (opts?:{reload: boolean}) => {
    if (!opts) opts = {reload: true}
    if (!isBoolean(opts.reload)) opts.reload = true

    let folder_dl = ".tiro/cache/downloads"
    getApi(api => {
        api.popup.confirm(`Do you want to proceed to the installation of demo files, it will replace the ".tiro/plugins" and "_demos" folders by new ones. It will backup in "_backup" any existing data`, () => {
            api.ressource.download("https://github.com/dotgreg/tiro-notes/raw/refs/heads/dev/demos_folder.zip", folder_dl, r => {
                api.ui.notification.notifLog("downloading demo files from github...","dl_demo_files")
                console.log(r)
                if (r.status === "SUCCESS") {
                    let pathToUnzip = r.message
                    let fileNameToUnzip = pathToUnzip.split(folder_dl)[1]
                    let relativePathToUnzip = `${folder_dl}${fileNameToUnzip}`
                    api.ui.notification.notifLog("download demo files from github success","dl_demo_files")
                    console.log(relativePathToUnzip)
                    let zf = folder_dl+"/unzip"
                    let rand = Math.round(Math.random()*10000)
                    api.ressource.unzipFile(relativePathToUnzip, zf, r => {
                        api.ui.notification.notifLog("unzip demo files successfully, reloading tiro...","dl_demo_files")
                        api.folders.move("/.tiro/plugins", `/_backup/_backup_${rand}/.tiro/plugins`, r => {console.log( r.result)})
                        api.folders.move("/_demos", `/_backup/_backup_${rand}/_demos`, r => {console.log( r.result)})
                        api.folders.move(zf+"/_demo_folder/plugins", "/.tiro/plugins", r => {console.log( r.result)})
                        api.folders.move(zf+"/_demo_folder/_demos", "/_demos", r => {console.log(r.result)})
                        api.ui.browser.folders.open.add("/")
                        opts?.reload && setTimeout(() => {
                            api.ui.browser.folders.open.add("/")
                            setTimeout(() => {
                                window.location.reload()
                            },2000)
                        },2000)
                    },{overwriteWarn:false})
                }
            })
        })
    })
}
