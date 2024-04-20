import { each } from "lodash-es";
import { regexs } from "../../../shared/helpers/regexs.helper"
import { iFile, iFileImage } from "../../../shared/types.shared";
import { absoluteLinkPathRoot } from "./textProcessor.manager";
import { cleanUrl } from "./url.manager";

export const findImagesFromContent = (content: string, file: iFile): iFileImage[] => {
	const matches = content.match(regexs.image)
	const images: iFileImage[] = []
	each(matches, match => {
		const titleRaw = match.match(regexs.firstPartImg)
		let title = titleRaw && titleRaw[0] ? titleRaw[0].replace('![', '').replace(']', '').replace('(', '') : ''
		const relUrl = match.replace(regexs.firstPartImg, '').replace(')', '')
		const nImg: iFileImage = {
			url: cleanUrl(absoluteLinkPathRoot(file.folder) + '/' + relUrl),
			title,
			file
		}
		images.push(nImg)
	})
	return images
}
