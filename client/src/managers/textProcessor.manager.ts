import {sharedConfig} from '../../../shared/shared.config'

let txt = `
fsdfdsfsa
![fdfdfdfd](fdfdfdfdfd.png)
adsffsdafads
`


export const transformUrlLinks = (bodyRaw: string):string => {
    const regex =  /(https:\/\/([A-Za-z0-9\/\:\.\_\-\/\\\\\?\=\&]*))/gm;
    const subst = `<a href="$1" about="_blank">$2</a>`;
    return bodyRaw.replace(regex, subst);
}

export const transformExtrawurstLinks = (bodyRaw: string):string => {
    const regex = /\[search\|([A-Za-z0-9\/\:\.\_\-\/\\\?\=\&\\ ]*)\]/gm;
    const subst = '<a href="#search[$1]">$1</a>';
    return bodyRaw.replace(regex, subst);
}

//  @TODO
// add folderPath that ./.resources/image.jpg becomes localhost:8082/dir1/dir2/dir3/.resources/image.jpg
export const transformImagesInHTML = (currentFolderPath:string, bodyRaw: string ):string => {
    const regex = /(\!\[([A-Za-z0-9\/\:\.\_\-\/\\\?\=\&]*)\]\(([A-Za-z0-9\/\:\.\_\-\/\\\?\=\&]*)\))/gm;
    const subst = `<img class="content-image" src="http://localhost:${sharedConfig.staticServerPort}/${currentFolderPath}/$3"  />`;
    return bodyRaw.replace(regex, subst);
}

// console.log(transformImagesInHTML(txt));