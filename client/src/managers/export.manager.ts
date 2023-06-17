//
	// EXPORT POPUP

import { cleanPath, pathToIfile } from "../../../shared/helpers/filename.helper"
import { sharedConfig } from "../../../shared/shared.config"
import { iFile, iViewType } from "../../../shared/types.shared"
import { getApi } from "../hooks/api/api.hook"
import { getStaticRessourceLink } from "./ressource.manager"
import { ssrFn } from "./ssr.manager"

const h = `[EXPORT]`

const downloadFile = (newFileName:string, pathToFile:string) => {
    // const popup = document.getElementById('export-popup-wrapper')
    // if (!popup) return console.warn('no popup for downloadFile')
    // popup.innerHTML = popup.innerHTML + `<iframe id="my_iframe" style="display:none;" src="${pathToFile}"></iframe>`
    var anchor = document.createElement('a');
    anchor.setAttribute("download", newFileName);
    anchor.setAttribute("href", pathToFile);
    anchor.setAttribute("target", "_blank");
    getApi(api => {api.ui.notification.emit({ content: `[EXPORT] done`, id:"export", options:{hideAfter: 3} })})
    anchor.click();
}

const exportTo = (el) => {
    if (!el) return
    let format = el.dataset.format
    let path = el.dataset.path
    console.log(h,0, {format, path})
    // getting the file
    if (!format || !path) return
    let ssrfile = pathToIfile(path)
    // get the absolute path of data folder
    getApi(api => {
        getApi(api => {api.ui.notification.emit({ content: `[EXPORT] converting...`, id:"export", options:{hideAfter: -1} })})
        console.log(h,1)
        api.config.get(cnf => {
            
            const destCacheFolder = `/${sharedConfig.path.configFolder}/${sharedConfig.path.cacheFolder}/pandoc`
            // create folders if does not exists
            api.folders.create(destCacheFolder, status => {
                
                //
                // RELATIVE + CD 
                //
                const newFileName = `${ssrfile.name}.${format}`
                const rootPath = `${cnf.dataFolder}/`
                const pathToCd = cleanPath(`${rootPath}/${ssrfile.folder}`)
                const inputFilePath = cleanPath(`./${ssrfile.name}`)
                const destPathAbs = cleanPath(`${rootPath}/${destCacheFolder}/${newFileName}`)
                const destDlPath = cleanPath(`/${sharedConfig.path.configFolder}/${sharedConfig.path.cacheFolder}/pandoc/${newFileName}`)

                const pandocCmd = `cd "${pathToCd}" && pandoc --output="${destPathAbs}" --toc --from=markdown --to=${format} "${inputFilePath}" `
                

                console.log(h,3,{format, pandocCmd, destPathAbs, inputFilePath,  ssrfile, destCacheFolder,  destDlPath})

                // execute pandoc pandocCmd into cache/export/file.fdsljfdsalkfjdsalj.ppt
                api.command.exec(pandocCmd, (res) => {
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
                        api.ui.notification.emit({ content: `[EXPORT] Error <br/> "${resObj.stderr} <br/><br/> ${resObj.shortMessage}"`, id:"export" })
                    } else {
                        console.log(h,7)
                       
                        // trigger download
                        let ressLink = getStaticRessourceLink(destDlPath)
                        downloadFile(newFileName, ressLink)

                        // delete that file after 2mi
                    }
                })
            })
        })
    })
}

export const triggerExportPopup = (file: iFile) => {
    getApi(api => {
        api.popup.show(`
        <div id="export-popup-wrapper">
            <div class="buttons-list"> 
                <button onclick="${ssrFn("export-note-to", exportTo)}" data-format="docx" data-path="${file.path}">docx</button>
                <button onclick="${ssrFn("export-note-to", exportTo)}" data-format="pdf" data-path="${file.path}">pdf</button>
                <button onclick="${ssrFn("export-note-to", exportTo)}" data-format="pptx" data-path="${file.path}">pptx</button>
            </div>

            <div class="advice">  
                <br/>
                Please make sure you have Pandoc v2.9 installed on your system to have docx/ppt exports working. 
                <a href="https://pandoc.org/installing.html" target="_blank">Guide here </a>
                
                <br/><br/>
                For PDF, make sure pdflatex is installed 
                <br/> (if you are on termux: <code>pkg install texlive-installer texlive-tlmgr; termux-install-tl</code>)
            </div>
        </div>
        `, "Export Note to :", (ttt) => {console.log(ttt)})
    })
}