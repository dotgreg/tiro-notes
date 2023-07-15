import { each, isNumber } from "lodash";
import { iAppView, iGrid, iTab } from "../../../shared/types.shared";
import { configClient } from "../config";
import { getApi } from "../hooks/api/api.hook";
import { isVarMobileView, iMobileView } from "./device.manager";


//
// V2
//
export const updateAppUrlFromActiveWindow  = (tabs:iTab[], mobileView:iMobileView) => {
	getApi(api => {
		const activeWindow = api.ui.windows.active.get()
		const filePath = activeWindow?.content.file?.path
		const view = activeWindow?.content.view
		let urlParamsArr = getUrlRawParams().array
		urlParamsArr = urlParamsArr.filter(el => el.name !== "filepath" && el.name !== "view")
		if (!filePath || !view) return
		urlParamsArr.unshift({name: "filepath", value: filePath})
		urlParamsArr.unshift({name: "view", value: view})
		console.log(1111111, activeWindow, urlParamsArr,{filePath, view})
		setUrlParams(urlParamsArr)
	})
}

//
// URL GETTER/SETTER
//
export const setUrlParams = (arr:iUrlRawParam[]) => {
	let newUrl = `${configClient.global.protocol}${configClient.global.url}${configClient.global.port}/?`
	each(arr, (param, i) => {
		let and = i < arr.length - 1  ? "&" : ""
		newUrl += `${param.name}=${param.value}${and}`
	})
	console.log(123, newUrl)
	window.history.pushState({}, document.title, newUrl)
}
export interface iUrlRawParamDic {
	[name: string]: iUrlRawParam
}
export interface iUrlRawParam {
	name: string, value:string
}
export const getUrlRawParams = (): {dic: iUrlRawParamDic, array:iUrlRawParam[]} => {
	let arr: iUrlRawParam[] = []
	let dic: iUrlRawParamDic = {}
	const queryString = window.location.search;
	const urlParamsSearch = new URLSearchParams(queryString);
	let entries = urlParamsSearch.entries()
	for(const entry of entries) {
		arr.push({name: entry[0], value: entry[1]})
		dic[entry[0]]={name: entry[0], value: entry[1]}
	}
	return {array: arr, dic}
}







// export const updateUrl = (urlParams: iUrlParams) => {
// 	let newUrl = `${configClient.global.protocol}${configClient.global.url}${configClient.global.port}/?`
// 	if (isNumber(urlParams.file) && urlParams.file !== -1) newUrl += `file=${urlParams.file}&`
// 	if (urlParams.title) newUrl += `title=${urlParams.title}&`
// 	if (urlParams.folder && urlParams.folder !== '' && !urlParams.search) newUrl += `folder=${urlParams.folder}&`
// 	if (!urlParams.folder && !urlParams.search) newUrl += `folder=/&`
// 	if (urlParams.search && urlParams.search !== '') newUrl += `search=${urlParams.search}&`
// 	if (urlParams.appview) newUrl += `appview=${urlParams.appview}&`
// 	window.history.pushState({}, document.title, newUrl)
// 	console.log(`[URL] UPDATEURL : NEW URL PUSHED => to ${JSON.stringify({ newUrl, urlParams })}`);
// 	// currentUrlParams = getUrlParams()
// }






//
// OLD SYSTEM
//


export interface iUrlParams {
	search?: string
	folder?: string
	title?: string
	file?: number
	mobileview?: iMobileView
	appview?: iAppView
}
let currentUrlParams: any = {}

// export const listenToUrlChanges = (p: {
// 	onUrlParamsChange: (urlParams: iUrlParams) => void,
// 	// onHashChange:(searchTerm:string)=>void
// }) => {
// 	window.onpopstate = () => {
// 		let newUrlParams = getUrlParams()
// 		// console.log('ONPOPSTATE DETECTED'); 
// 		if (JSON.stringify(newUrlParams) === JSON.stringify(currentUrlParams)) return
// 		currentUrlParams = newUrlParams
// 		console.log('[URL CHANGE DETECTED]', newUrlParams);
// 		p.onUrlParamsChange(newUrlParams)
// 	}
// }

export const checkUrlParamsPorts = () => {
}



// export const getUrlParams = (): iUrlParams => {
// 	let urlParams: iUrlParams = {}
// 	const queryString = window.location.search;
// 	const urlParamsSearch = new URLSearchParams(queryString);
// 	urlParams.search = urlParamsSearch.get('search') || undefined
// 	urlParams.file = urlParamsSearch.get('file') ? parseInt(urlParamsSearch.get('file') as string) : undefined
// 	urlParams.folder = urlParamsSearch.get('folder') || undefined
// 	urlParams.title = urlParamsSearch.get('title') || undefined
// 	urlParams.appview = urlParamsSearch.get('appview') as iAppView || undefined
// 	urlParams.mobileview = isVarMobileView(urlParamsSearch.get('mobileview')) ? urlParamsSearch.get('mobileview') as MobileView : undefined
// 	return urlParams
// }

export const urlParamsToString = (urlParams: iUrlParams): string => {
	let res = ''
	let i = 0
	for (const key in urlParams) {
		if (Object.prototype.hasOwnProperty.call(urlParams, key)) {
			if (urlParams[key]) {
				res += `${i === 0 ? '' : '&'}${key.toLowerCase()}=${urlParams[key]}`
				i++
			}
		}
	}
	return res
}


export const checkUrlExists = (p:{url, onSuccess, onFail}) => {
	try {
		var http = new XMLHttpRequest();
		http.open('HEAD', p.url, false);
		http.send();
		// return http.status != 404;
		if (http.status !== 404) return p.onSuccess()
		return p.onFail()
	} catch (e) {
		p.onFail(e)
	}
}
