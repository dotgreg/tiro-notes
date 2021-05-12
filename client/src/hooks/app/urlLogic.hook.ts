import { isNumber } from "lodash"
import { useEffect, useRef } from "react"
import { iFile } from "../../../../shared/types.shared"
import { getUrlParams, iUrlParams, listenToUrlChanges, updateUrl } from "../../managers/url.manager"
import { useDebounce } from "../lodash.hooks"

export const useUrlLogic = (
    isSearching, searchTerm,
    selectedFolder,
    activeFile:iFile,
    activeFileIndex,

    p:{
        reactToUrlParams: (newUrlParams:iUrlParams) => void
    }
) => {
    // ignore the first url change when page finishes loading
    const ignoreNextUrlChange = useRef(false)

    useEffect(() => {
        initUrlParamsLogic()
    }, [])

    const initUrlParamsLogic = () => {

        // do a initial reading when finished loading
        let newUrlParams = getUrlParams()
        p.reactToUrlParams(newUrlParams)

        listenToUrlChanges({
            onUrlParamsChange: (newUrlParams) => {
                // ignore url change due to state change from reaction of initial url change :S
                ignoreNextUrlChange.current = true
                p.reactToUrlParams(newUrlParams)
            },
        })
    }



    const updateAppUrl = useDebounce(() => {
        if (ignoreNextUrlChange.current) return ignoreNextUrlChange.current = false
        // console.log('updateurlapp', {activeFile, selectedFolder});
        
        if (!activeFile) return
        console.log('[UPDATE APP URL]');
        updateUrl ({
            title: activeFile.realname, 
            folder: selectedFolder, 
            search: searchTerm
        })
    }, 200)

    useEffect(() => {
        updateAppUrl()
    }, [activeFileIndex, selectedFolder, isSearching])
}