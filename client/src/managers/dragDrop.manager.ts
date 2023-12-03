import { debounce } from "lodash";
import { configClient } from "../config";
import { pathToIfile } from "../../../shared/helpers/filename.helper";
import { iFile } from "../../../shared/types.shared";

//
// EXPORTED FUNCTION
//
export const handleFileDrop = (ev, callback:(file:File)=>void) => {
	ev.preventDefault();
	if (ev.dataTransfer && ev.dataTransfer.items) {
		let files = ev.dataTransfer.items
		if (!files[0]) return
		for (let i = 0; i < files.length; i++) {
			callback(files[i].getAsFile())
		}
	}
}


export const initDragDropListener = (p: {
	onDropped: (file?: File) => void
	onDragEnd: () => void
	onEditorsDragOver: (file:iFile) => void
}) => {
	

	const handleDrop = (ev) => {
		ev.preventDefault();
		if (ev.dataTransfer && ev.dataTransfer.items) {
			let files = ev.dataTransfer.items
			if (!files[0]) return
			for (let i = 0; i < files.length; i++) {
				p.onDropped(files[i].getAsFile())
			}
		}
	}
	const handleDragOver = (e) => {
		console.log("dddddddd")
		e.preventDefault();
		dragEndDebounced()
	}

	let lastDragOverEditorFilePath = ""
	const handleEditorsDragOver = (el) => (e) => {
		e.preventDefault();
		// get data-file-paht
		// console.log(e.target)
		const filePath = el.getAttribute("data-file-path")
		if (lastDragOverEditorFilePath === filePath) return
		lastDragOverEditorFilePath = filePath
		const file = pathToIfile(filePath)
		p.onEditorsDragOver(file)
	}

	const dragEndDebounced = debounce(() => {
		p.onDragEnd()
	}, 100)

	configClient.log.upload && console.log(`[UPLOAD] reinit drag/drop events`);

	window.addEventListener('drop', handleDrop);
	// window.addEventListener('dragover', handleDragOver);
	
	// add dragstart event to all elements with class "drag-to-upload-enabled"
	document.querySelectorAll(".drag-to-upload-enabled").forEach(el => {
		el.addEventListener('dragover', handleEditorsDragOver(el))
	})

	// send back cleanup functions
	const cleanUpFunc = () => {
		window.removeEventListener('drop', handleDrop);
		// window.removeEventListener('dragover', handleDragOver);
		// window.addEventListener('dragstart', handleEditorsDragOver);
		document.querySelectorAll(".drag-to-upload-enabled").forEach(el => {
			el.removeEventListener('dragover', handleEditorsDragOver(el))
			
			
		})
	}
	return cleanUpFunc
}


