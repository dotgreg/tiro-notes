import { iApiDictionary } from "../../../shared/apiDictionary.type";
import { regexs } from "../../../shared/helpers/regexs.helper";
import { iFilePreview } from "../../../shared/types.shared";
import { backConfig } from "../config.back";
import { openFile } from "./fs.manager";

export const getFilesPreviewLogic = async (data: iApiDictionary['askFilesPreview']): Promise<iFilePreview[]> => {
	let filesPreview: iFilePreview[] = []

	for (let i = 0; i < data.filesPath.length; i++) {
		const path = `${backConfig.dataFolder}/${data.filesPath[i]}`;

		// open file
		let body = await openFile(path)

		// remove === HEADER ===
		let bodyWithoutHeader = body.replace(regexs.metas, '')

		const filePreview: iFilePreview = {
			path: data.filesPath[i],
			content: bodyWithoutHeader.trim().substr(0, 100)
		}


		// content = 200 first chars

		// pictures run a regex to find ![](), can be shared with frontend regex

		let match = bodyWithoutHeader.match(regexs.image)
		if (match && match[0]) {
			let imagePath = match[0].replace(regexs.firstPartImg, '').replace(')', '')
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
