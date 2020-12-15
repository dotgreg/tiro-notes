import {sharedConfig} from '../../../shared/shared.config'

let txt = `
fsdfdsfsa
![fdfdfdfd](fdfdfdfdfd.png)
adsffsdafads
`



export const transformImagesInHTML = (bodyRaw: string):string => {
    // let res:string = ''
    // let regexRessource = /\[[a-zA-Z0-9_-]*\.([a-zA-Z0-9]*)\]\(\:\/([a-zA-Z0-9]*)\)/gm
    const regex = /(\!\[([A-Za-z0-9\/\:\.\_\-\/\\]*)\]\(([A-Za-z0-9\/\:\.\_\-\/\\]*)\))/gm;
    const subst = `<img class="content-image" src="http://localhost:${sharedConfig.staticServerPort}/$3"  />`;
    return bodyRaw.replace(regex, subst);
}

console.log(transformImagesInHTML(txt));