import { log } from "console";
import { debounce, throttle } from "lodash";
import { configClient } from "../config";
import { clientSocket, clientSocket2 } from "./sockets/socket.manager";

export interface iUploadedFile {
	name: string
	path: string
}


var siofu = require("socketio-file-upload");

const handleDrop = (ev, onProgress: Function) => {
	ev.preventDefault();
	if (ev.dataTransfer && ev.dataTransfer.items) {
		let files = ev.dataTransfer.items
		if (!files[0]) return
		// @TODO multiple files handling
		for (let i = 0; i < files.length; i++) {
			// const element = files[i];
			uploadFile(files[i].getAsFile(), onProgress)
		}
	}
}


// const test = document.getElementById("image-file") as HTMLInputElement
// const filetest.files?[0]


export const listenOnUploadSuccess = (cb: (file: iUploadedFile) => void): number => {
	return clientSocket2.on('getUploadedFile', data => { cb(data) })
}

export const startProgressTracker = (instanceFile: any, onProgress: Function) => {
	instanceFile.addEventListener("progress", (event: any) => {
		const percent = Math.round((event.bytesLoaded / event.file.size) * 100)
		onProgress(percent);
	})
}

export const uploadFile = (file: any, onProgress: Function) => {
	var instanceFile = new siofu(clientSocket);
	instanceFile.submitFiles([file]);
	startProgressTracker(instanceFile, onProgress);
}

export const uploadOnInputChange = (el: HTMLInputElement, onProgress: Function) => {
	var instance = new siofu(clientSocket);
	instance.listenOnInput(el);
	startProgressTracker(instance, onProgress);
}


const liveOnProgress: any = { func: () => { } }
const handleDropWithProg = (ev) => {
	handleDrop(ev, liveOnProgress.func);
}

export const initListenUploadOnDrop = (callbacks: {
	onDragStart: Function
	onDragEnd: Function
	onProgress: Function
}) => {
	liveOnProgress.func = callbacks.onProgress

	const handleDragOver = (e) => {
		e.preventDefault();
		dragEndDebounced()
	}

	const dragEndDebounced = debounce(() => {
		callbacks.onDragEnd()
	}, 100)

	configClient.log.upload && console.log(`[UPLOAD] reinit drag/drop events`);

	window.removeEventListener('drop', handleDropWithProg);
	window.addEventListener('drop', handleDropWithProg);

	window.removeEventListener('dragover', handleDragOver);
	window.addEventListener('dragover', handleDragOver);


}
