import {sharedConfig} from '../../../shared/shared.config'
import { configClient } from '../config';
import { replaceAll } from './string.manager';

export const transformUrlInLinks = (bodyRaw: string):string => {
    const regex =  /(https?:\/\/([A-Za-z0-9\/\:\.\_\-\/\\\?\=\&\@\!\%\ \#]*))/gm;
    // const regex =  /(https?:\/\/([A-Za-z0-9\/\:\.\_\-\/\\\?\=\&\@\!\%\ \#]*))/gm;
    const codeOpenPopup = `onclick="window.open('$1','$1','width=600,height=600');"`
    const subst = `<a class="external-link preview-link" href="#" ${codeOpenPopup}>$2</a>`;
    return bodyRaw.replace(regex, subst);
}

export const transformTitleSearchLinks = (bodyRaw: string):string => {
    const regex = /\[link\|([A-Za-z0-9\/\:\.\_\-\/\\\?\=\&\@\!\#\ ]*)\ (\/[A-Za-z0-9\/\:\.\_\-\/\ \\\?\=\&\@\!\#]*)\]/gm;
    const subst = `<a class="title-search-link preview-link" href="javascript:window.tiroCli.searchFileFromTitle.func('$1','$2');">$1</a>`;
    return bodyRaw.replace(regex, subst); 
}
export const transformSearchLinks = (bodyRaw: string):string => {
    const regex = /\[search\|([A-Za-z0-9\/\:\.\_\-\/\\\?\=\&\@\!\#]*)([A-Za-z0-9\/\:\.\_\-\/\ \\\?\=\&\@\!\#]*)\]/gm;
    const subst = `<a class="search-link preview-link" href="javascript:window.tiroCli.triggerSearch.func('$1$2');">$1</a>`;
    let body =  bodyRaw.replace(regex, subst); 
    body = replaceAll(body, [
        ['>[__id_','>['],
        ['>[__tags_','>['],
        ['>[__tag_','>['],
        [' ]</a>',']</a>'],
    ])
    return body
}

export const absoluteLinkPathRoot = (currentFolderPath:string) => `${configClient.global.protocol}://${configClient.global.staticUrl}:${sharedConfig.staticServerPort}/${currentFolderPath}`
//  @TODO
// add folderPath that ./.resources/image.jpg becomes localhost:8082/dir1/dir2/dir3/.resources/image.jpg
export const transformRessourcesInHTML = (currentFolderPath:string, bodyRaw: string ):string => {
    const regex = /(\!\[([A-Za-z0-9\/\:\.\_\-\/\\\?\=\&\@\!\ \#]*)\]\(([A-Za-z0-9\/\:\.\_\-\/\\\?\=\&\@\!\ \#]*)\))/gm;
    const ressLink = `${absoluteLinkPathRoot(currentFolderPath)}/$3`
    const codeOpenPopup = `onclick="window.open('${ressLink}','popupdl','width=800,height=1000');"`
    const subst = `<a class="resource-link preview-link" href="#" ${codeOpenPopup}>$2</a>`;
    // const subst = `<a href="${ressLink}" download="$2">$2</a>`;
    return bodyRaw.replace(regex, subst);
}

export const transformImagesInHTML = (currentFolderPath:string, bodyRaw: string ):string => {
    const regex = /(\!\[([A-Za-z0-9\/\:\.\_\-\/\\\?\=\&\@\!\ \#]*)\]\(([A-Za-z0-9\/\:\.\_\-\/\\\?\=\&\@\!\ \#]*\.(jpg|jpeg|png|gif))\))/gm;
    const subst = `<img class="content-image" src="${absoluteLinkPathRoot(currentFolderPath)}/$3"  />`;
    return bodyRaw.replace(regex, subst);
}

// console.log(transformImagesInHTML(txt));