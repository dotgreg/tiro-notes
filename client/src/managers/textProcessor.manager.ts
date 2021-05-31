import {sharedConfig} from '../../../shared/shared.config'
import { configClient } from '../config';
import { regexs } from '../../../shared/helpers/regexs.helper';
import { replaceAll } from './string.manager';
import { getBackendUrl } from './sockets/socket.manager';

export const transformUrlInLinks = (bodyRaw: string):string => {
    const codeOpenPopup = `onclick="window.open('$1','$1','width=600,height=600');"`
    const subst = `<a class="external-link preview-link" href="#" ${codeOpenPopup}>$2</a>`;
    return bodyRaw.replace(regexs.url2transform, subst);
}

export const transformTitleSearchLinks = (bodyRaw: string):string => {
    const subst = `<a class="title-search-link preview-link" href="javascript:window.tiroCli.searchFileFromTitle.func('$1','$2');">$1</a>`;
    return bodyRaw.replace(regexs.linklink, subst); 
}
export const transformSearchLinks = (bodyRaw: string):string => {
    const subst = `<a class="search-link preview-link" href="javascript:window.tiroCli.triggerSearch.func('$1$2');">$1</a>`;
    let body =  bodyRaw.replace(regexs.searchlink, subst); 
    body = replaceAll(body, [
        ['>[__id_','>['],
        ['>[__tags_','>['],
        ['>[__tag_','>['],
        [' ]</a>',']</a>'],
    ])
    return body
}

export const absoluteLinkPathRoot = (currentFolderPath:string) =>  `${getBackendUrl()}/static/${currentFolderPath}`
//  @TODO
// add folderPath that ./.resources/image.jpg becomes localhost:8082/dir1/dir2/dir3/.resources/image.jpg
export const transformRessourcesInHTML = (currentFolderPath:string, bodyRaw: string ):string => {
    const ressLink = `${absoluteLinkPathRoot(currentFolderPath)}/$2`
    const codeOpenPopup = `onclick="window.open('${ressLink}','popupdl','width=800,height=1000');"`
    const subst = `<a class="resource-link preview-link" href="#" ${codeOpenPopup}>$1</a>`;
    return bodyRaw.replace(regexs.ressource, subst);
}

export const transformImagesInHTML = (currentFolderPath:string, bodyRaw: string ):string => {
    const subst1 = `<img class="content-image" src="$1"  />`;
    bodyRaw = bodyRaw.replace(regexs.extimage, subst1);

    const subst = `<img class="content-image" src="${absoluteLinkPathRoot(currentFolderPath)}/$1"  />`;
    return bodyRaw.replace(regexs.image, subst);
}

// console.log(transformImagesInHTML(txt));