import { isNumber } from "lodash"
import { useEffect, useRef } from "react"
import { iFile } from "../../../../shared/types.shared"
import { getUrlParams, iUrlParams, listenToUrlChanges, updateUrl } from "../../managers/url.manager"
import { useDebounce } from "../lodash.hooks"
import { AppView, iSwitchTypeViewFn } from "./appView.hook"

export const useUrlLogic = (
    isSearching, searchTerm,
    selectedFolder,
    activeFile:iFile,
    activeFileIndex,
    currentAppView:AppView,

    p:{
        reactToUrlParams: (newUrlParams:iUrlParams) => void
    }
) => {
    // ignore the first url change when page finishes loading
    const ignoreNextUrlChange = useRef(false)

    // on init
    useEffect(() => {
        initUrlParamsLogic()
    }, [])

    const reactToUrl = () => {
        // do a initial reading when finished loading
        let newUrlParams = getUrlParams()
        p.reactToUrlParams(newUrlParams)
    }

    const initUrlParamsLogic = () => {

        reactToUrl()

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
        
        if (!activeFile) return
        updateUrl ({
            title: activeFile.realname, 
            folder: selectedFolder, 
            search: searchTerm,
            appview: currentAppView
        })
    }, 200)

    // in case of params changes, update url
    useEffect(() => {
        updateAppUrl()
    }, [activeFileIndex, selectedFolder, isSearching, currentAppView])

    return {reactToUrl}
}