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
    // getting the file
    if (!format || !path) return
    let ssrfile = pathToIfile(path)
    // get the absolute path of data folder
    getApi(api => {
        getApi(api => {api.ui.notification.emit({ content: `[EXPORT] converting...`, id:"export", options:{hideAfter: -1} })})
        
        api.config.get(cnf => {
            
            const destCacheFolder = `/${sharedConfig.path.configFolder}/${sharedConfig.path.cacheFolder}/pandoc`
            // create folders if does not exists
            api.folders.create(destCacheFolder, status => {
                
                let perTypeOptions = ``
                if (format === "dzslides") perTypeOptions = `--self-contained`
                if (format === "slideous") perTypeOptions = `--self-contained`
                if (format === "revealjs") perTypeOptions = `--self-contained`
                if (format === "beamer") perTypeOptions = `--self-contained`

                let extension = format
                if (format === "dzslides") extension = "html"
                if (format === "slideous") extension = "html"
                if (format === "revealjs") extension = "html"
                if (format === "latex") extension = "tex"
                if (format === "gfm") extension = "md"
                if (format === "latex-pdf") extension = "pdf"
                if (format === "beamer") extension = "pdf"
                //
                // RELATIVE + CD 
                //
                let destPathFileNoExt = `${ssrfile.name}`
                let destPathFile = `${destPathFileNoExt}.${extension}`
                const rootPath = `${cnf.dataFolder}/`
                const pathToCd = cleanPath(`${rootPath}/${ssrfile.folder}`)
                const inputFilePath = cleanPath(`./${ssrfile.name}`)
                const destPathFolder = cleanPath(`${rootPath}/${destCacheFolder}`)
                const destPathAbs = cleanPath(`${destPathFolder}/${destPathFile}`)
                const destDlPath = cleanPath(`/${sharedConfig.path.configFolder}/${sharedConfig.path.cacheFolder}/pandoc/${destPathFile}`)

               

                const pandocCmd = `cd "${pathToCd}" && pandoc --output="${destPathAbs}" ${api.userSettings.get("export_pandoc_cli_options")} ${perTypeOptions} --from=markdown --to=${format} "${inputFilePath}" `
                
                let finalCmd = pandocCmd
                if (format === "latex-pdf") {
                    finalCmd = `cd "${pathToCd}" && pdflatex -output-directory="${destPathFolder}" -jobname="${destPathFileNoExt}" "${inputFilePath}" `
                }


                // execute pandoc pandocCmd into cache/export/file.fdsljfdsalkfjdsalj.ppt
                api.command.exec(finalCmd, (res) => {
                    let resObj  = {failed:false, stderr:null, shortMessage: null}
                    try {
                        resObj = JSON.parse(res) || {failed:false}
                    } catch (e) {
                    }
                    
                    if (resObj.failed) {
                        api.ui.notification.emit({ content: `[EXPORT] Error <br/> "${resObj.stderr} <br/><br/> ${resObj.shortMessage}"`, id:"export" })
                    } else {
                       
                        // trigger download
                        let ressLink = getStaticRessourceLink(destDlPath)
                        downloadFile(destPathFile, ressLink)

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
            <button onclick="${ssrFn("export-note-to", exportTo)}" data-format="odt " data-path="${file.path}">odt</button>
            <button onclick="${ssrFn("export-note-to", exportTo)}" data-format="pdf" data-path="${file.path}">pdf</button>
                <button onclick="${ssrFn("export-note-to", exportTo)}" data-format="pptx" data-path="${file.path}">pptx</button>
                <button onclick="${ssrFn("export-note-to", exportTo)}" data-format="gfm" data-path="${file.path}">markdown</button>
                <button onclick="${ssrFn("export-note-to", exportTo)}" data-format="epub" data-path="${file.path}">epub</button>
                <button onclick="${ssrFn("export-note-to", exportTo)}" data-format="rtf" data-path="${file.path}">rtf</button>
                <button onclick="${ssrFn("export-note-to", exportTo)}" data-format="beamer" data-path="${file.path}">beamer (pdf slides)</button>
                </div>
                
            <div class="buttons-list"> 
                Latex:
                <br/>
                <button onclick="${ssrFn("export-note-to", exportTo)}" data-format="latex" data-path="${file.path}">latex (.tex)</button>
                <button onclick="${ssrFn("export-note-to", exportTo)}" data-format="latex-pdf" data-path="${file.path}">latex (.pdf)</button>
                
            </div>
            <div class="buttons-list"> 
                Html Presentation: 
                <br/>
                <button onclick="${ssrFn("export-note-to", exportTo)}" data-format="dzslides" data-path="${file.path}">dzslides</button>
                <button onclick="${ssrFn("export-note-to", exportTo)}" data-format="slideous" data-path="${file.path}">slideous</button>
                <button onclick="${ssrFn("export-note-to", exportTo)}" data-format="revealjs" data-path="${file.path}">revealjs</button>
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