import { each } from "lodash"
import { iFile } from "../../../shared/types.shared"
import { previewAreaSimpleCss } from "../components/dualView/PreviewArea.component"
import { formatDateList } from "./date.manager"

// V1 => copier a barbare HTML dans nouvel window
// V2 => api > getContent > render > PB IL FAUT FAIRE CELA AVEC TOUS CONTENT, C LA MERDE

export const printFileContent = (windowId: string, file: iFile) => {
	const queryToShow = `.window-id-${windowId} .preview-area-wrapper`
	let previewToPrint = document.querySelector(queryToShow)

	const printClass = `print-wrapper`

	const cleanPrinted = () => {
		let oldPreviews = document.querySelectorAll(`.${printClass}`)
		each(oldPreviews, p => {
			p.classList.remove(printClass)
		})
	}

	if (previewToPrint) {
		cleanPrinted()
		// previewToPrint.classList.add(printClass)
		// document.body.classList.add('print-body')
		// window.print()
		// console.log(previewToPrint.classList);

		let created = formatDateList(new Date(file.modified || 0))
		let modified = formatDateList(new Date(file.modified || 0))
		let d = {
			w: '.simple-css-print-wrapper',
			pl: '.preview-link',
			r: '.resource-link-icon'
		}

		let html = `
<head>
<title>${file.name} </title>
</head>
<html>
<body>

				<div class="simple-css-print-wrapper">
				<div class="file-infos-wrapper">
				Note Name : ${file.name}<br>
				Note Path : ${file.path}<br>
				Created : ${created}<br>
				Edited : ${modified}<br>
				</div>
				${previewToPrint.innerHTML}
				</div>

				<style>${previewAreaSimpleCss(d)}</style>
				<style>${customStylePdfPrint()}</style>
</body>
</html>
				`

		let printWindow = window.open("", `print-popup`, 'width=800,height=1000')
		printWindow?.document.write(html);
		setTimeout(() => {
			printWindow?.print()
			printWindow?.close()
		}, 500)
	}
}

export const customStylePdfPrint = () => {
	return `
@page {
margin: 0;
}

* {
	-webkit-print-color-adjust: exact; 
	print-color-adjust: exact; 
}

.file-path-wrapper {
	display: none;
}
.file-infos-wrapper {
	background: #eeeeee;
	padding: 10px;
	margin: 10px;
}
		.simple-css-print-wrapper {
			margin: 20px;
			width: 70%;

		}
		img {
				max-width: 300px!important;
				max-height: 500px!important;
		}
		.block-tag {
				display: none;
		}
		`}
