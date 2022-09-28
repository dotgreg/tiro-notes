import { each } from 'lodash';
import React, { useState } from 'react';
import { getUrlTokenParam } from '../hooks/app/loginToken.hook';
import { cssVars } from '../managers/style/vars.style.manager';
import { absoluteLinkPathRoot } from '../managers/textProcessor.manager';
import { ButtonsToolbar, iToolbarButton } from './ButtonsToolbar.component';

export const RessourcePreview = (p: {
	markdownTag: string
	folderPath: string
}) => {
	const [iframeOpen, setIframeOpen] = useState(false)

	const link = p.markdownTag.split('](')[1].slice(0, -1);
	const name = p.markdownTag.split('](')[0].replace('![', '');
	let t1 = link.split('.');
	let filetype = t1[t1.length - 1];
	if (filetype === '7z') filetype = 'd7z';
	const ressLink = `${absoluteLinkPathRoot(p.folderPath)}/${link}${getUrlTokenParam()}`
	let downloadName = `${name}.${filetype}`

	//
	// TOOLBAR BUTTONS
	//
	let buttons: iToolbarButton[] = [
		{
			title: 'Download',
			icon: 'faDownload',
			action: () => { console.log(ressLink, downloadName); downloadFile(downloadName, ressLink) }
		},
	]

	//
	// IF CAN BE PREVIEWED
	//
	let canBePreviewed = false
	let previewFormats = ["pdf", "mp4", "mp3", "ogg", "wav", "aac", "webm", "flac", "txt", "json", "css", "js", "html"]
	if (previewFormats.includes(filetype.toLowerCase())) canBePreviewed = true

	// for doc/docx/xls/xlsx/ppt/pptx + if window.location is not ip OR localhost, open it with google preview
	let cOrigin = window.location.origin
	let onlinePreviewFormats = ["ppt", "pptx", "doc", "docx", "xls", "xlsx"]
	let canBePreviewedOnline = onlinePreviewFormats.includes(filetype.toLowerCase())
	let localOrigins = ["localhost", "192.168"]
	let isLocal = inArray(cOrigin, localOrigins)
	let previewLink = ressLink
	if (!isLocal && canBePreviewedOnline) previewLink = `https://docs.google.com/gview?url=${ressLink}`

	if (canBePreviewed || (!isLocal && canBePreviewedOnline)) {
		buttons.unshift({
			title: 'Open in detached window',
			icon: 'faExternalLinkAlt',
			action: () => {
				window.open(previewLink, `popup-${previewLink}`, 'width=800,height=1000')
			}
		})
		buttons.unshift({
			title: !iframeOpen ? 'Preview' : 'Close Preview',
			icon: !iframeOpen ? 'faEye' : 'faEyeSlash',
			action: () => { setIframeOpen(!iframeOpen) }
		})
	}

	return (
		<div className="resource-link-wrapper">
			<div className={`resource-link-icon ${filetype}`}></div>
			<div className={`resource-link-content-wrapper`}>
				<a className="resource-link preview-link"
					href={ressLink}
					download={downloadFile}
				>
					{name} ({filetype})
				</a>

				<ButtonsToolbar
					buttons={buttons}
					size={1}
				/>
			</div>

			{
				iframeOpen &&
				<iframe
					src={previewLink}
					title={previewLink}
					allowFullScreen
					className="resource-link-iframe"
				/>
			}
		</div>
	)
}

export const ressourcePreviewCss = () => `

`
let w = '.resource-link-icon'
export const ressourcePreviewSimpleCss = (d) => `
.resource-link-iframe iframe{
		border-radius: 5px;
}
.resource-link-iframe {
		border: 2px solid rgba(0,0,0,0.1);
		border-radius: 5px;
		width: calc(100% - 20px);
		margin: 10px;
		margin-top: 20px;
		margin-left: 0px;
		padding: 4px;
		height: 50vh;
		
}
.resource-link-wrapper {
		background: #f7f6f6;
		padding: 20px;
		border-radius: 10px;
		position: relative;
		margin: 5px 0px;
}

.resource-link-icon {
		top: 14px;
		left: 19px;
		width: 21px;
		height: 27px;
		display: inline-block;
		background-image: url(/static/media/file-solid.6415173e.svg);
		opacity: 0.08;
		position: absolute;
		background-repeat: no-repeat;
		transform: scale(1.5);
		background-image: url(${cssVars.assets.fileIcon});
}

${w}.epub, ${w}.cbr, ${w}.cbz,${w}.mobi, ${w}.azw, ${w}.azw3, ${w}.iba { background-image: url(${cssVars.assets.bookIcon}); }
${w}.pdf
{ background-image: url(${cssVars.assets.pdfIcon}); }

${w}.xls, ${w}.xlsm, ${w}.xlsx, ${w}.ods
{ background-image: url(${cssVars.assets.excelIcon}); }

${w}.avi, ${w}.flv, ${w}.h264, ${w}.m4v, ${w}.mov, ${w}.mp4, ${w}.mpg, ${w}.mpeg, ${w}.rm, ${w}.swf, ${w}.vob, ${w}.wmv, ${w}.mkv
{ background-image: url(${cssVars.assets.videoIcon}); }

${w}.d7z, ${w}.arj, ${w}.deb, ${w}.rar, ${w}.gz, ${w}.zip, ${w}.rpm, ${w}.pkg
{ background-image: url(${cssVars.assets.archiveIcon});}

${w}.aif, ${w}.mp3, ${w}.cda, ${w}.mid, ${w}.mpa, ${w}.ogg, ${w}.wav, ${w}.wpl, ${w}.wma, ${w}.midi
{ background-image: url(${cssVars.assets.audioIcon}); }

${w}.doc, ${w}.docx, ${w}.odt, ${w}.txt
{ background-image: url(${cssVars.assets.wordIcon}); }

${w}.html, ${w}.css, ${w}.js, ${w}.json, ${w}.ts, ${w}.jsx, ${w}.tsx 
{ background-image: url(${cssVars.assets.codeIcon}); }

${w}.bin, ${w}.dmg, ${w}.iso, ${w}.toast, ${w}.vcd
{
		top: 19px;
		transform: scale(1.8);
		background-image: url(${cssVars.assets.diskIcon});
}

${w}.ppt, ${w}.pptx, ${w}.odp, ${w}.key, ${w}.pps
{ background-image: url(${cssVars.assets.presIcon}); }


.resource-link-content-wrapper {
		display: flex;
}

.resource-link-content-wrapper {
}

.resource-link-wrapper:hover .resource-link-content-wrapper ul {
		opacity:1;
		pointer-events: all;
}
.resource-link-content-wrapper ul  {
		padding-left: 7px;
		opacity: 0;
		transition: 0.2s all;
		pointer-events: none;
}
.resource-link-content-wrapper ul li {
		padding-left: 0px;
}
.resource-link-content-wrapper ul li:before {
		display: none;
}

`

const downloadFile = (filename: string, url: string) => {
	// Create an invisible A element
	const a = document.createElement("a");
	a.style.display = "none";
	document.body.appendChild(a);
	a.href = url
	a.target = "_blank"
	a.setAttribute("download", filename);
	a.click();
	window.URL.revokeObjectURL(a.href);
	document.body.removeChild(a);
}

const inArray = (needle: string, haystack: string[]) => {
	let res = false
	each(haystack, el => {
		// console.log(el.includes(needle), el, needle);
		if (el.includes(needle)) res = true
		if (needle.includes(el)) res = true
	})
	return res;
}
