import { debounce } from "lodash";
import { configClient } from "../config";

//
// EXPORTED FUNCTION
//
export const initDragDropListener = (p: {
	onDropped: (file?: File) => void
	onDragEnd: () => void
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
		e.preventDefault();
		dragEndDebounced()
	}

	const dragEndDebounced = debounce(() => {
		p.onDragEnd()
	}, 100)

	configClient.log.upload && console.log(`[UPLOAD] reinit drag/drop events`);

	window.addEventListener('drop', handleDrop);
	window.addEventListener('dragover', handleDragOver);


	// send back cleanup functions
	const cleanUpFunc = () => {
		window.removeEventListener('drop', handleDrop);
		window.removeEventListener('dragover', handleDragOver);
	}
	return cleanUpFunc
}


