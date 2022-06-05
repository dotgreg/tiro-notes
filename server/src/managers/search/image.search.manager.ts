import { regexs } from "../../../../shared/helpers/regexs.helper";
import { sharedConfig } from "../../../../shared/shared.config";
import { iFile, iFileImage } from "../../../../shared/types.shared";
import { backConfig } from "../../config.back";
import { cleanFilePath, processRawPathToFile } from "./file.search.manager";

export const processRawStringsToImagesArr = (rawMetasStrings: string[], folder:string, titleFilter:string = ''):iFileImage[] => {
    const imagesArr:iFileImage[] = []

    for (let i = 0; i < rawMetasStrings.length; i++) {
        /**
         * FILTERING
         * trying to filter as much as possible lines to avoid expensive calculations below
         */
        let rawStr = rawMetasStrings[i];
        if (!rawStr.includes('![') || !rawStr.includes('](')) continue
        
        // filter on string
        rawStr = rawStr.split('\r').join('')
        if (rawStr === '') continue
        
        // filter on nb results
        const rawMetaArr2 = rawStr.split('.md:')
        if (rawMetaArr2.length < 1) continue

        const content = rawMetaArr2[1]
        if (!content.includes('![') || !content.includes('](')) continue
        

         /**
         * STRING PROCESSING
         */
        const fileName = `${rawMetaArr2[0]}.md`;
        let cleanedFileName = cleanFilePath(fileName, folder)
		const file = processRawPathToFile({rawPath: cleanedFileName, folder})

        if (titleFilter !== '' && !file.path.toLowerCase().includes(titleFilter.toLowerCase())) continue

        const image = processStringToImage(content, file)
        
        if (image && image.url) imagesArr.push(image)
    }
    return imagesArr
}

export const processStringToImage = (raw:string, file:iFile):iFileImage|null => {
    

    const matchs = raw.match(regexs.imageAndTitleCapture)   
    if (!matchs || matchs.length !== 1) return null
    let imgStr = matchs[0]
    imgStr = imgStr.replace('![', '')
    imgStr = imgStr.replace(')', '')
    let imgStrArr = imgStr.split('](')
    if (!imgStrArr || imgStrArr.length !== 2) return null
    const rawSrc = imgStrArr[1]
    const path = rawSrc.startsWith('http') ? rawSrc : file.folder + '/' + rawSrc
    return {
        url: path,
        title: imgStrArr[0],
        file
    }
}
