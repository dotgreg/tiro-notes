import { each } from "lodash-es";
import { regexs } from "../../../shared/helpers/regexs.helper";
import { processStringToMeta } from "../../../shared/helpers/metas.helper";
import { sharedConfig } from "../../../shared/shared.config";
import { iFile, iFileMetas } from "../../../shared/types.shared";
import { replaceAll } from "./string.manager";

export interface fileMetaAndContent { metas: iFileMetas, content: string }
export const filterMetaFromFileContent = (fileContentWithMeta: string): fileMetaAndContent => {
	let matchs = fileContentWithMeta.match(regexs.metas)
	const metas: iFileMetas = {}

	// find metas
	if (matchs && matchs[0]) {
		const stringsArr = matchs[0].split('\n')
		for (let i = 0; i < stringsArr.length; i++) {
			const meta = processStringToMeta(stringsArr[i])
			if (meta) metas[meta.name] = meta.value
		}
	}

	// if 1113437293 format > 1113437293000 format
	if (`${metas.created}`.length === 10) metas.created = parseInt(`${metas.created}`) * 1000
	if (`${metas.updated}`.length === 10) metas.updated = parseInt(`${metas.updated}`) * 1000

	//remove metas block from content
	let newContent = fileContentWithMeta
	// replaceAll regex regexs.metas by nothing 
	newContent = newContent.replace(regexs.metasAndSpace, '')
	newContent = newContent.replace(regexs.metas, '')
 

	return {
		metas,
		content: newContent
	}
}

export const metasObjToHeaderString = (metas: iFileMetas): string => {
	let res = `${sharedConfig.metas.headerStart}\n`
	each(metas, (metaContent, metaName) => {
		res += `${metaName}: ${metaContent}\n`
	})
	res += `${sharedConfig.metas.headerEnd}\n`
	return res
}

export const addBackMetaToContent = (content: string, metas: iFileMetas): string => {
	let res = metasObjToHeaderString(metas)
	res += content
	return res
}


// export const updateMetaHeaderNote = (rawWithMeta: string, file:iFile): string => {
// 	// if metas already exist, take their value
// 	let res = ""
// 	const { metas, content } = filterMetaFromFileContent(rawWithMeta)
	
	
// 	let newMetas:iFileMetas = {
// 		created: Date.now(),
// 		updated: Date.now()
// 	}
	
// 	if (metas.created) newMetas.created = metas.created

// 	// meta string
// 	let headerMetaString = metasObjToHeaderString(newMetas)

// 	// add metas to content
// 	res = `${headerMetaString}${content}`
// 	console.log({rawWithMeta, metas, content, res })

// 	return res
// }