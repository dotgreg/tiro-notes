import {sharedConfig} from '../../../shared/shared.config'
import { configClient } from '../config';

export const transformUrlInLinks = (bodyRaw: string):string => {
    const regex =  /(https?:\/\/([A-Za-z0-9\/\:\.\_\-\/\\\?\=\&\ \#]*))/gm;
    const codeOpenPopup = `onclick="window.open('$1','popup','width=600,height=600');"`
    const subst = `<a href="#" ${codeOpenPopup}>$2</a>`;
    return bodyRaw.replace(regex, subst);
}

export const transformExtrawurstLinks = (bodyRaw: string):string => {
    const regex = /\[search\|([A-Za-z0-9\/\:\.\_\-\/\\\?\=\&\#]*)([A-Za-z0-9\/\:\.\_\-\/\ \\\?\=\&\#]*)\]/gm;
    const subst = `<a class="extrawurst-link" href="javascript:window.ewTriggerSearch('$1$2');">[$1]</a>`;
    let body =  bodyRaw.replace(regex, subst); 
    body = body.replaceAll('>[__id_', '>[');
    body = body.replaceAll('>[__tags_', '>[');
    body = body.replaceAll('>[__tag_', '>[');
    body = body.replaceAll(' ]</a>', ']</a>');
    return body
}

//  @TODO
// add folderPath that ./.resources/image.jpg becomes localhost:8082/dir1/dir2/dir3/.resources/image.jpg
export const transformRessourcesInHTML = (currentFolderPath:string, bodyRaw: string ):string => {
    const regex = /(\!\[([A-Za-z0-9\/\:\.\_\-\/\\\?\=\&\ \#]*)\]\(([A-Za-z0-9\/\:\.\_\-\/\\\?\=\&\ \#]*)\))/gm;
    const ressLink = `http://${configClient.global.staticUrl}:${sharedConfig.staticServerPort}/${currentFolderPath}/$3`
    const codeOpenPopup = `onclick="window.open('${ressLink}','popupdl','width=200,height=200');"`
    const subst = `<a href="#" ${codeOpenPopup}>$2</a>`;
    // const subst = `<a href="${ressLink}" download="$2">$2</a>`;
    return bodyRaw.replace(regex, subst);
}
export const transformImagesInHTML = (currentFolderPath:string, bodyRaw: string ):string => {
    const regex = /(\!\[([A-Za-z0-9\/\:\.\_\-\/\\\?\=\&\ \#]*)\]\(([A-Za-z0-9\/\:\.\_\-\/\\\?\=\&\ \#]*\.(jpg|jpeg|png|gif))\))/gm;
    const subst = `<img class="content-image" src="http://${configClient.global.staticUrl}:${sharedConfig.staticServerPort}/${currentFolderPath}/$3"  />`;
    return bodyRaw.replace(regex, subst);
}

// console.log(transformImagesInHTML(txt));