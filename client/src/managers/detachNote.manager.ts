import { iFile } from "../../../shared/types.shared";
import { iUrlParams, urlParamsToString } from "./url.manager";

export const detachNote = (file: iFile) => {
        // let urlParams = getUrlParams()
        // urlParams.mobileview = 'editor'
        let urlParams:iUrlParams = {
            title: file.realname,
            folder: file.folder,
            mobileview: 'editor'
        }
        
        let fullUrl = `${window.location.protocol}//${window.location.host}?${urlParamsToString(urlParams)}`
        
        window.open(
            fullUrl,
            'popupDetached',
            'width=600,height=600');
}

export const detachNoteNewWindowButtonConfig = (file: iFile) => {
    return {
        title:'detach in new window', 
        icon:'faExternalLinkAlt', 
        action: () => {detachNote(file)}
      }
}