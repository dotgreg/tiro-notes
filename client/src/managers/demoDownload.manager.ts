import { getApi } from "../hooks/api/api.hook"

export const triggerDemoDownload = () => {
    let folder_dl = ".tiro/cache/downloads"
    getApi(api => {
        api.popup.confirm(`Do you want to proceed to the installation of demo files, it will replace the ".tiro/plugins" and "_demos" folders by new ones. It will backup in "_backup" any existing data`, () => {
            api.ressource.download("https://github.com/dotgreg/tiro-notes/raw/refs/heads/dev/demo_folder.zip", folder_dl, r => {
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
                        api.folders.move(zf+"/demo_folder/.tiro/plugins", "/.tiro/plugins", r => {console.log( r.result)})
                        api.folders.move(zf+"/demo_folder/demos", "/_demos", r => {console.log(r.result)})
                        setTimeout(() => {window.location.reload()},3000)
                    },{overwriteWarn:false})
                }
            })
        })
    })
}
