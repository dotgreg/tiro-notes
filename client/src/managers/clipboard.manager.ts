
//
//
// EXPORTED FUNCTION
//
export const initClipboardListener = (events: {
	onImagePasted: (Blob: any) => void
}) => {

	const onPaste = (e) => {
		console.log('ONPASTE');
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

export const copyToClickBoard = (el: HTMLInputElement) => {
	// var content = document.getElementById('textArea').innerHTML;
	const content = el.value

	if (!navigator || !navigator.clipboard) return
	
	navigator.clipboard.writeText(content)
		.then(() => {
			console.log("Text copied to clipboard...")
		})
		.catch(err => {
			console.log('Something went wrong', err);
		})

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

	if (items == undefined) {
		if (typeof (callback) == "function") {
			callback(undefined);
		}
	};

	for (var i = 0; i < items.length; i++) {
		// Skip content if not image
		if (items[i].type.indexOf("image") == -1) continue;
		console.log(`[PASTE] informations on files pasted : `, pasteEvent, items, items.length);
		var blob = items[i].getAsFile();
		if (typeof (callback) == "function") {
			callback(blob);
		}
	}
}
