import { getApi } from "../hooks/api/api.hook"
import { deviceType } from "./device.manager"
import { getMostRecentFile } from "./sort.manager"

export const createNewNote = (p: {
    openIn: 'activeWindow' | 'floatingWindow'
    folderPath?: string
}) => {
    console.log("createNewNote", p)
    getApi(api => {
        let selectedFolder = p.folderPath || api.ui.browser.folders.current.get() 
        
        api.file.create(selectedFolder, files => {
            const nFile = getMostRecentFile(files)
            if (!nFile) return	
            if (p.openIn === 'floatingWindow') {
                api.ui.floatingPanel.create({
                    type: "file",
                    file: nFile,
                    view: "editor",
                    // layout: deviceType() === "mobile" ? "bottom" : "bottom-right",
                })
            } else {
                nFile && api.ui.browser.goTo(selectedFolder, nFile.name, { openIn: 'activeWindow' })
            }
        })
    })
}