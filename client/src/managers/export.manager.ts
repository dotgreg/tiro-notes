//
	// EXPORT POPUP

import { cleanPath, pathToIfile } from "../../../shared/helpers/filename.helper"
import { sharedConfig } from "../../../shared/shared.config"
import { iFile, iViewType } from "../../../shared/types.shared"
import { getApi } from "../hooks/api/api.hook"
import { getLoginToken } from "../hooks/app/loginToken.hook"
import { getStaticRessourceLink } from "./ressource.manager"
import { ssrFn } from "./ssr.manager"

	//
	export const triggerExportPopup = (file: iFile) => {
		// OLD
		

        const downloadFile = (pathToFile:string) => {
            // const popup = document.getElementById('export-popup-wrapper')
            // if (!popup) return console.warn('no popup for downloadFile')
            // popup.innerHTML = popup.innerHTML + `<iframe id="my_iframe" style="display:none;" src="${pathToFile}"></iframe>`
            var anchor = document.createElement('a');
            anchor.setAttribute("download", "true");
            anchor.setAttribute("href", pathToFile);
            anchor.setAttribute("target", "_blank");
            anchor.click();
        }
        const h = `[EXPORT]`

        // const exportToOld = () => {
        //     const currView:iViewType = p.viewType || "editor"
        //     // if we are editor, make preview appearing for a moment 
        //     if (currView === "editor") {
        //         askForViewToggle("both")
        //         setTimeout(() => {
        //             openExportFilePopup(p.windowId, p.file)
        //             setTimeout(() => {
        //                 askForViewToggle("editor")
        //             })
        //         }, 100)
        //     } else {
        //         openExportFilePopup(p.windowId, p.file)
        //     }
        // }
        
        const exportTo = (el) => {
            if (!el) return
            let format = el.dataset.format
            let path = el.dataset.path
            // getting the file
            if (!format || !path) return
            let ssrfile = pathToIfile(path)
            // get the absolute path of data folder
            getApi(api => {
                console.log(h,1)
                api.config.get(cnf => {
                    const destCacheFolder = `${cnf.dataFolder}/${sharedConfig.path.configFolder}/${sharedConfig.path.cacheFolder}/pandoc`
                    console.log(h,2)
                    // create folders if does not exists
                    api.folders.create(destCacheFolder, status => {
                        const newFileName = `${file.name}.${format}`
                        const destPath = cleanPath(`${destCacheFolder}/${newFileName}`)
                        const inputFolder = cleanPath(`${cnf.dataFolder}/${file.path}`)
                        
                        let cmd = ``
                        // if (format === "pdf") cmd = `pandoc -o '${destPath}' --pdf-engine=xelatex -f markdown -t ${format} '${inputFolder}'`
                        if (format === "pdf") cmd = `pandoc -o '${destPath}' -f markdown -t ${format} '${inputFolder}'`
                        if (format === "docx") cmd = `pandoc -o '${destPath}' -f markdown -t ${format} '${inputFolder}'`
                        if (format === "pptx") cmd = `pandoc -o '${destPath}' -f markdown -t ${format} '${inputFolder}'`
                        

                        console.log(h,3,{format, cmd, destPath, inputFolder, ssrfile, destCacheFolder})

                        // execute pandoc cmd into cache/export/file.fdsljfdsalkfjdsalj.ppt
                        api.command.exec(cmd, (res) => {
                            let resObj  = {failed:false, stderr:null, shortMessage: null}
                            try {
                                console.log(h,4)
                                resObj = JSON.parse(res) || {failed:false}
                            } catch (e) {
                                console.log(h,5)
                            }
                            
                            console.log(resObj)
                            if (resObj.failed) {
                                console.log(h,6)
                                api.ui.notification.emit({
                                    content: `[EXPORT] Error <br/> "${resObj.stderr} <br/><br/> ${resObj.shortMessage}"`
                                })
                            } else {
                                console.log(h,7)
                                const destDlFolder = `/${sharedConfig.path.configFolder}/${sharedConfig.path.cacheFolder}/pandoc`
                                const destDlPath = `/${destDlFolder}/${newFileName}`
                                // trigger download
                                let ressLink = getStaticRessourceLink(destDlPath)
                                downloadFile(ressLink)

                                // delete that file after 2mi
                            }
                        })
                    })
                })
            })
        }

        getApi(api => {
			api.popup.show(`
			<div id="export-popup-wrapper">
                <div class="buttons-list"> 
                    <button onclick="${ssrFn("open-win-ress", exportTo)}" data-format="docx" data-path="${file.path}">docx</button>
                    <button onclick="${ssrFn("open-win-ress", exportTo)}" data-format="pdf" data-path="${file.path}">pdf</button>
                    <button onclick="${ssrFn("open-win-ress", exportTo)}" data-format="pptx" data-path="${file.path}">pptx</button>
                </div>

                <div class="advice">  
                    <br/>
                    Please make sure you have Pandoc v2.9 installed on your system to have docx/ppt exports working. 
                    For PDF, make sure xelatex is installed
                    <a href="https://pandoc.org/installing.html" target="_blank">Guide here </a>
                </div>
			</div>
			`, "Export Note", (ttt) => {console.log(ttt)})
		})
	}