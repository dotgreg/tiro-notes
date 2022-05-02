import { generateUUID } from "../../../../shared/helpers/id.helper";
import { regexs } from "../../../../shared/helpers/regexs.helper";
import { getLoginToken } from "../../hooks/app/loginToken.hook";
import { filterMetaFromFileContent } from "../headerMetas.manager";
import { clientSocket2 } from "../sockets/socket.manager";
import { clientApiEventsBus, genIdReq } from "./api.manager";


export const initFileApi = () => {
	clientSocket2.on('getFileContent', data => {
		let filterRes = filterMetaFromFileContent(data.fileContent)
		clientApiEventsBus.addPermanentListener(data.idReq, filterRes.content)
	})
}

//
// 1. GET CONTENT
const apiGetFileContent: iFileApi['getContent'] = (noteLink, cb) => {
	console.log(`[CLIENT API] 005363 get file content`);
	const filePath = noteLinkToPath(noteLink);
	const idReq = genIdReq('get-file-content');
	// 1. add a listener function
	clientApiEventsBus.triggerOnce(idReq, cb);
	// 2. emit request 
	clientSocket2.emit('askForFileContent', {
		filePath,
		token: getLoginToken(),
		idReq
	})
}


// 2. SET CONTENT
const apiSaveFileContent: iFileApi['saveContent'] = (
	noteLink: string,
	content: string
) => {
	console.log(`[CLIENT API] 005363 save file content`);
	const filePath = noteLinkToPath(noteLink);
	clientSocket2.emit('saveFileContent', {
		filePath, newFileContent: content,
		token: getLoginToken()
	})
}

//
// EXPORTS
//
export const fileApi = {
	getContent: apiGetFileContent,
	saveContent: apiSaveFileContent,
}

export interface iFileApi {
	getContent: (noteLink: string, cb: Function) => void
	saveContent: (noteLink: string, content: string) => void
}


//
// SUPPORT FUNCTIONS
//

const noteLinkToPath = (noteLink: string): string => {
	const subst = `$2/$1`;
	return noteLink.replace(regexs.linklink, subst);
}
