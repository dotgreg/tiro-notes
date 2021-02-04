import { getUrlParams, urlParamsToString } from "./url.manager";

export const detachNoteNewWindowButtonConfig = () => {

    
    return {
        title:'detach in new window', 
        icon:'faExternalLinkAlt', 
        action: () => {
            let urlParams = getUrlParams()
            urlParams.mobileview = 'editor'
            
            let fullUrl = `${window.location.protocol}//${window.location.host}?${urlParamsToString(urlParams)}`
            
            window.open(
                fullUrl,
                'popupDetached',
                'width=600,height=600');
            }
      }
}