import { useEffect, useRef, useState } from "react"
import { iAppView, iFile } from "../../../../shared/types.shared"
import { addCliCmd } from "../../managers/cliConsole.manager"

export const useSearchFromTitle = (p:{
    changeToFolder,
    currentAppView: iAppView 
}) => {
    const {changeToFolder, currentAppView} = {...p}

    // if we are asked to go to folder, than to a specific file from its title
    const searchedFileTitle = useRef<string|undefined>()

    const searchFileFromTitle = (title:string, folderPath:string) => {
        console.log(`[TITLE SEARCH] => ${title}-${folderPath}`);
        searchedFileTitle.current = title
        changeToFolder(folderPath, currentAppView, false)
    }

    const getSearchedTitleFileIndex = (files:iFile[]):number => {
        if (!searchedFileTitle.current) return -1
        console.log(`[TITLE SEARCH] getSearchedTitleFileIndex start searching for "${searchedFileTitle.current}" in ${files.length} files`);
        let res = 0
        const title2search = searchedFileTitle.current
        searchedFileTitle.current = undefined
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.name.includes(title2search)) {
                console.log(`[TITLE SEARCH] NOTE FOUND ${file.name},${i}`);
                res = i
                return res
            }
        }
        return res
    } 
    
    return {searchedFileTitle, getSearchedTitleFileIndex, searchFileFromTitle}
}
