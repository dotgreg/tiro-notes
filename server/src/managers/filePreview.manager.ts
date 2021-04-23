import { iSocketEventsParams } from "../../../shared/apiDictionary.type";
import { iFilePreview } from "../../../shared/types.shared";
import { backConfig } from "../config.back";
import { openFile } from "./fs.manager";

export const getFilesPreviewLogic = async (data: iSocketEventsParams.askFilesPreview):Promise<iFilePreview[]> => {
    let filesPreview:iFilePreview[] = []

    for (let i = 0; i < data.filesPath.length; i++) {
        const path = `${backConfig.dataFolder}/${data.filesPath[i]}`;
        
        // open file
        let body = await openFile(path)
        const filePreview:iFilePreview = {
            path: data.filesPath[i],
            content: body.trim().substr(0,100)
        }
        

        // content = 200 first chars

        // pictures run a regex to find ![](), can be shared with frontend regex

        const regex = /\!\[([A-Za-z0-9\/\:\.\_\-\/\\\?\=\&\@\!\ \#]*)\]\(([A-Za-z0-9\/\:\.\_\-\/\\\?\=\&\@\!\ \#]*\.(jpg|jpeg|png|gif))\)/gm;
        let match = body.match(regex)
        if (match && match[0]) {
            const regex2 = /\!\[([A-Za-z0-9\/\:\.\_\-\/\\\?\=\&\@\!\ \#]*)\]\(/gm;
            let imagePath =  match[0].replace(regex2,'').replace(')','')
            // console.log(333, res);
            filePreview.picture = imagePath
        }
        filesPreview.push(filePreview)
        
        // export const transformImagesInHTML = (currentFolderPath:string, bodyRaw: string ):string => {
        //     const subst = `<img class="content-image" src="http://${configClient.global.staticUrl}:${sharedConfig.staticServerPort}/${currentFolderPath}/$3"  />`;
        //     return bodyRaw.replace(regex, subst);
        // }
    }

    return filesPreview
}