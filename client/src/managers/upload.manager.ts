import { getLoginToken } from "../hooks/app/loginToken.hook";
import { clientSocket, clientSocket2 } from "./sockets/socket.manager";

export interface iUploadedFile {
	name: string
	path: string
}

var siofu = require("socketio-file-upload");

//
// MAIN UPLOAD FUNCTION
//

export const uploadFileInt = (p: {
	file: File,
	path: string,
	idReq: string,
	onProgress: Function
}) => {
	const { file, path, idReq, onProgress } = { ...p }
	var instanceFile = new siofu(clientSocket);
	instanceFile.addEventListener("start", event => {
		event.file.meta.idReq = idReq
		event.file.meta.path = path
		event.file.meta.token = getLoginToken()
	});
	instanceFile.addEventListener("progress", (event: any) => {
		const percent = Math.round((event.bytesLoaded / event.file.size) * 100)
		onProgress(percent);
	})
	instanceFile.submitFiles([file]);
}

