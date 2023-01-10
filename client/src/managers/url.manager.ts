import { isNumber } from "lodash";
import { iAppView } from "../../../shared/types.shared";
import { configClient } from "../config";
import { isVarMobileView, MobileView } from "./device.manager";

export interface iUrlParams {
	search?: string
	folder?: string
	title?: string
	file?: number
	mobileview?: MobileView
	appview?: iAppView
}
let currentUrlParams: any = {}

export const listenToUrlChanges = (p: {
	onUrlParamsChange: (urlParams: iUrlParams) => void,
	// onHashChange:(searchTerm:string)=>void
}) => {
	window.onpopstate = () => {
		let newUrlParams = getUrlParams()
		// console.log('ONPOPSTATE DETECTED'); 
		if (JSON.stringify(newUrlParams) === JSON.stringify(currentUrlParams)) return
		currentUrlParams = newUrlParams
		console.log('[URL CHANGE DETECTED]', newUrlParams);
		p.onUrlParamsChange(newUrlParams)
	}
}

export const checkUrlParamsPorts = () => {
}

export const getUrlParams = (): iUrlParams => {
	let urlParams: iUrlParams = {}
	const queryString = window.location.search;
	const urlParamsSearch = new URLSearchParams(queryString);
	urlParams.search = urlParamsSearch.get('search') || undefined
	urlParams.file = urlParamsSearch.get('file') ? parseInt(urlParamsSearch.get('file') as string) : undefined
	urlParams.folder = urlParamsSearch.get('folder') || undefined
	urlParams.title = urlParamsSearch.get('title') || undefined
	urlParams.appview = urlParamsSearch.get('appview') as iAppView || undefined
	urlParams.mobileview = isVarMobileView(urlParamsSearch.get('mobileview')) ? urlParamsSearch.get('mobileview') as MobileView : undefined
	return urlParams
}

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

export const updateUrl = (urlParams: iUrlParams) => {

	let newUrl = `${configClient.global.protocol}${configClient.global.url}${configClient.global.port}/?`

	if (isNumber(urlParams.file) && urlParams.file !== -1) newUrl += `file=${urlParams.file}&`

	if (urlParams.title) newUrl += `title=${urlParams.title}&`

	if (urlParams.folder && urlParams.folder !== '' && !urlParams.search) newUrl += `folder=${urlParams.folder}&`

	if (!urlParams.folder && !urlParams.search) newUrl += `folder=/&`

	if (urlParams.search && urlParams.search !== '') newUrl += `search=${urlParams.search}&`

	if (urlParams.appview) newUrl += `appview=${urlParams.appview}&`

	window.history.pushState({}, document.title, newUrl)

	console.log(`[URL] UPDATEURL : NEW URL PUSHED => to ${JSON.stringify({ newUrl, urlParams })}`);
	// currentUrlParams = getUrlParams()
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
