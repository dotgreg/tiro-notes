const pdfApp = (innerTagStr, opts) => {
		if (!opts) opts = {}
		const ressPath = opts.base_url + "/ressources2"

		const h = `[CTAG PDF VIEWER] v1.0 path:"${ressPath}"`
		//@ts-ignore
		const api = window.api;
		const { div, updateContent } = api.utils.createDiv();

		// console.log(h, '1woop');
		// const execPdfViewer = (feedsStr) => {
		// 		console.log(h, 'woop');
		// }
		// api.utils.resizeIframe("80%");

		// window.pdf_controller = {
		// 		disableAutoFetch: true,
		// 		disableStream: true,
		// 		debug: false,
		// 		workerSrc: `${ressPath}/pdf_lib.worker.js`,
		// 		url: innerTagStr
		// }

		// const libsToLoad = 				[
		// 		`${ressPath}/pdf_lib.js`,
		// 		`${ressPath}/viewer.js`
		// ]

		// // setTimeout(() => {
		// api.utils.loadScripts(
		// 		[`${ressPath}/pdf_lib.js`],
		// 		() => {
		// 				api.utils.loadScripts(
		// 						[`${ressPath}/viewer.js`],
		// 						() => {
		// 								console.log("PDF",window.pdf_controller, pdfjsLib);
		// 								execPdfViewer(innerTagStr)
		// 						})
		// 		}
		// );
		// }, 5000)


		const html = `
<iframe src="${ressPath}/viewer.html?path=${innerTagStr}" style="width: 100%; height:100vh; border: none;"/>

		`


		return html
}

window.initCustomTag = pdfApp
