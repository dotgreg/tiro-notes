// import { isNumber } from "lodash"
// import { useEffect, useRef } from "react"
// import { iAppView, iFile } from "../../../../shared/types.shared"
// import { getUrlParams, iUrlParams, listenToUrlChanges, updateUrl } from "../../managers/url.manager"
// import { useDebounce } from "../lodash.hooks"
// import { iSwitchTypeViewFn } from "./appView.hook"

// export const useUrlLogic = (
// 	isSearching, searchTerm,
// 	selectedFolder,
// 	activeFile: iFile,
// 	activeFileIndex,
// 	currentAppView: iAppView,

// 	p: {
// 		reactToUrlParams: (newUrlParams: iUrlParams) => void
// 	}
// ) => {
// 	// ignore the first url change when page finishes loading
// 	const ignoreNextUrlChange = useRef(false)

// 	// on init
// 	useEffect(() => {
// 		initUrlParamsLogic()
// 	}, [])

// 	const initUrlParamsLogic = () => {
// 		reactToUrl()
// 		listenToUrlChanges({
// 			onUrlParamsChange: (newUrlParams) => {
// 				// ignore url change due to state change from reaction of initial url change :S
// 				ignoreNextUrlChange.current = true
// 				p.reactToUrlParams(newUrlParams)
// 			},
// 		})
// 	}

// 	// REACT TO URL CHANGE <<<===
// 	const reactToUrl = () => {
// 		// do a initial reading when finished loading
// 		let newUrlParams = getUrlParams()
// 		p.reactToUrlParams(newUrlParams)
// 	}

// 	// CHANGE URL ===>>>>
// 	// Everytime there is a modif in selected file index, folder, search 
// 	const updateAppUrl = useDebounce(() => {
// 		if (ignoreNextUrlChange.current) return ignoreNextUrlChange.current = false
// 		const title = activeFile ? activeFile.realname : ''
// 		if (currentAppView === 'text' && !activeFile) return
// 		updateUrl({
// 			title,
// 			folder: selectedFolder,
// 			search: searchTerm,
// 			appview: currentAppView
// 		})
// 	}, 200)

// 	// in case of params changes, update url
// 	useEffect(() => {
// 		console.log(`[URL] USE_EFFECT SOME CHANGED IN URL : ${JSON.stringify({ activeFileIndex, selectedFolder, isSearching, currentAppView })}`);
// 		updateAppUrl()
// 	}, [activeFileIndex, selectedFolder, isSearching, currentAppView])

// 	return { reactToUrl }
// }

export {}