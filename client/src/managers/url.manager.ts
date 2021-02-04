import { isNumber } from "lodash";
import { isVarMobileView, MobileView } from "./device.manager";

export interface iUrlParams {
    search?:string
    folder?:string
    file?:number
    mobileview?:MobileView
}
let currentUrlParams:any = {}

export const listenToUrlChanges = (p:{
    onUrlParamsChange:(urlParams:iUrlParams)=>void, 
    // onHashChange:(searchTerm:string)=>void
}) => {
    // window.onhashchange = () => { 
    //     let hash = window.location.hash.substr(1)
    //     hash = decodeURI(hash)
    //     if (hash.length > 0) {
    //         console.log(`[HASH CHANGE]`, hash)
    //         if (hash.startsWith('search[')) {
    //         let searchTerm = hash.replaceAll('search[','').replaceAll(']','').replaceAll('_','-')
    //         p.onHashChange(searchTerm)
    //       }
    //     }
    //     window.location.hash = ''
    // }

    //@ts-ignore
    window.log2 = console.log
   
    
    window.onpopstate  = () => { 
        let newUrlParams = getUrlParams()
        // console.log('ONPOPSTATE DETECTED'); 
        // console.log(JSON.stringify(newUrlParams),JSON.stringify(currentUrlParams)); 
        
        if (JSON.stringify(newUrlParams) === JSON.stringify(currentUrlParams)) return
        currentUrlParams = newUrlParams
        // console.log('11 pop',currentUrlParams);
        console.log('[URL CHANGE DETECTED]', newUrlParams);
        p.onUrlParamsChange(newUrlParams)
    }
}

export const getUrlParams = ():iUrlParams => {
    let urlParams:iUrlParams = {}
    const queryString = window.location.search;
    const urlParamsSearch = new URLSearchParams(queryString);
    urlParams.search = urlParamsSearch.get('search') || undefined
    urlParams.file = urlParamsSearch.get('file') ? parseInt(urlParamsSearch.get('file') as string) : undefined
    urlParams.folder = urlParamsSearch.get('folder') || undefined
    urlParams.mobileview = isVarMobileView(urlParamsSearch.get('mobileview')) ? urlParamsSearch.get('mobileview') as MobileView : 'navigator'
    return urlParams
}

export const urlParamsToString = (urlParams:iUrlParams):string => {
    let res = ''
    let i = 0
    for (const key in urlParams) {
        if (Object.prototype.hasOwnProperty.call(urlParams, key)) {
            if (urlParams[key]) {
                res += `${i === 0 ? '' : '&'}${key}=${urlParams[key]}`
                i++
            }
        }
    }
    return res
}

export const updateUrl = (urlParams:iUrlParams) => {
    

    let newUrl = `${window.location.protocol}//${window.location.host}/?`
    if (isNumber(urlParams.file) && urlParams.file !== -1) newUrl += `file=${urlParams.file}&`

    if (urlParams.folder && urlParams.folder !== ''  && !urlParams.search) newUrl += `folder=${urlParams.folder}&`

    if (!urlParams.folder && !urlParams.search) newUrl += `folder=/&`

    if (urlParams.search && urlParams.search !== '') newUrl += `search=${urlParams.search}&`

    window.history.pushState({},document.title, newUrl)

    currentUrlParams = getUrlParams()
    // console.log('12 updateurl', currentUrlParams);
}