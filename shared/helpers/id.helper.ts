export const generateUUID = (): string => {
	var d = new Date().getTime();//Timestamp
	//@ts-ignore
	var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now() * 1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		var r = Math.random() * 16;//random number between 0 and 16
		if (d > 0) {//Use timestamp until depleted
			r = (d + r) % 16 | 0;
			d = Math.floor(d / 16);
		} else {//Use microseconds since page-load if supported
			r = (d2 + r) % 16 | 0;
			d2 = Math.floor(d2 / 16);
		}
		return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
	});
}

export const getRessourceIdFromUrl = (rawUrl: string): string => {
	// let idRess = url.replace(/[^\w\s]/gi, '_').replace(/(_js)/gi, '.js').replace(/(_css)/gi, '.css')
	let urlParams = rawUrl.split("?")[1] || ""
	let url = rawUrl.split("?")[0]

	let idUrl = url.replace(/[^\w\s]/gi, '_')
	let idParams = urlParams.replace(/[^\w\s]/gi, '_')

	let ressType = url.split(".").pop() || ""
	ressType = "." + ressType.replace(/[^\w\s]/gi, '_')
	if (ressType.length > 6 || ressType.length <= 1) ressType = ""

	let nameRess = `${idUrl}_${idParams}`
	// if it is too long (more than 255 char) we cut it
	if (nameRess.length > 200) nameRess = nameRess.slice(0, 200)

	return `${nameRess}${ressType}`
}
