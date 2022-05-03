
//
//
// EXPORTED FUNCTION
//
export const initClipboardListener = (events: {
	onImagePasted: (Blob: any) => void
}) => {

	const onPaste = (e) => {
		retrieveImageFromClipboardAsBlob(e, function (imageBlob) {
			if (imageBlob) {
				events.onImagePasted(imageBlob)
			}
		});
	}

	window.addEventListener("paste", onPaste, false);

	// send back cleanup functions
	const cleanUpFunc = () => {
		window.removeEventListener("paste", onPaste, false);
	}
	return cleanUpFunc
}

//
// SUPPORT FUNCTION
//
const retrieveImageFromClipboardAsBlob = (pasteEvent, callback) => {
	if (pasteEvent.clipboardData == false) {
		if (typeof (callback) == "function") {
			callback(undefined);
		}
	};

	var items = pasteEvent.clipboardData.items;
	console.log(`[PASTE] informations on files pasted : `, pasteEvent, items, items.length);

	if (items == undefined) {
		if (typeof (callback) == "function") {
			callback(undefined);
		}
	};

	for (var i = 0; i < items.length; i++) {
		// Skip content if not image
		if (items[i].type.indexOf("image") == -1) continue;
		var blob = items[i].getAsFile();
		if (typeof (callback) == "function") {
			callback(blob);
		}
	}
}
