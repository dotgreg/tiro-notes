import { clamp, each } from 'lodash';
import React, { Ref, useContext, useEffect, useRef, useState } from 'react';
import { regexs } from '../../../../shared/helpers/regexs.helper';
import { iFile } from '../../../../shared/types.shared';
import { ClientApiContext } from '../../hooks/api/api.hook';
import { formatDateList } from '../../managers/date.manager';
import { deviceType, isA, isIpad, MobileView } from '../../managers/device.manager';
import { getContentChunks, iContentChunk, noteApi } from '../../managers/renderNote.manager';
import { cssVars } from '../../managers/style/vars.style.manager';
import { commonCssEditors } from './EditorArea.component';
import { ContentBlock } from '../ContentBlock.component';



export const PreviewArea = (p: {
				windowId: string

									file: iFile
												posY: number
															fileContent: string
																					 onMaxYUpdate: (maxY: number) => void
		}) => {

		const api = useContext(ClientApiContext);

		const previewAreaRefs = {
				wrapper: useRef<HTMLDivElement>(null),
								 main: useRef<HTMLDivElement>(null),
		}

		let currentFolderArr = p.file.path.split('/')
		currentFolderArr.pop()
		let currentFolder = currentFolderArr.join('/')

		useEffect(() => {
		setTimeout(() => {
		p.onMaxYUpdate(calculateYMax())
}, 1000)

		noteApi.injectLogic()

}, [p.fileContent])


		const calculateYMax = () => {
				const d = previewAreaRefs.main.current
				const height = d?.clientHeight
				const max = height || 3000
				return max
		}

		const calculateYPos = () => {
				const max = calculateYMax();
				return clamp(p.posY, 0, max)
		}

		const [contentBlocks, setContentBlocks] = useState<iContentChunk[]>([])
		useEffect(() => {
		setContentBlocks(getContentChunks(p.fileContent))
}, [p.fileContent])


		return (
				<div className={`preview-area-wrapper`}>
				<div
				className={`preview-area`}
				ref={previewAreaRefs.wrapper}
				style={{ bottom: calculateYPos() }}
				>

				<div className="infos-preview-wrapper">
				<div className="file-path-wrapper">
				{p.file.path.replace(`/${p.file.name}`, '')}
				</div>

				<h1 className="title big-title">
				{p.file.name.replace('.md', '')}
				</h1>

				<div className="dates-wrapper">
				<div className='date modified'>modified: {formatDateList(new Date(p.file.modified || 0))}</div>
																																																 <div className='date created'>created: {formatDateList(new Date(p.file.created || 0))}</div>
																																																																																											 </div>
																																																																																											 </div>

																																																																																											 <div className="content-blocks-wrapper">
																																																																																											 <div className="simple-css-wrapper">
				{
						contentBlocks.map(block =>
															<>
															<ContentBlock
															block={block}
															windowId={p.windowId}
															file={p.file}
															/>
															</>
)
				}
				</div>
				</div>

				</div>
				</div>
		)
}


export const previewAreaSimpleCss = () => {

		const d = {
				w: '.simple-css-wrapper',
					 pl: '.preview-link',
							 r: '.resource-link-icon'
		}

		const css = `
		${d.w} {
				color: ${cssVars.colors.editor.font};
				line-height: 19px;
				font-size: 11px;
				font-family:${cssVars.font.main};
		}

		button,
		input {
				font-family:${cssVars.font.main};
				font-weight: 700;
				color: ${cssVars.colors.l2.title};
		}

		/**********************************************************

		// COUNTER TITLES

**********************************************************/

		${d.w} {
				counter-reset: sh1;
				overflow-wrap: break-word;
		}

		h1:before {
				content: ""counter(sh1)" ∙ ";
				counter-increment: sh1;
		}
		h1 {
				counter-reset: sh2;
		}
		h2:before {
				content: ""counter(sh1)"." counter(sh2)" ∙  ";
				counter-increment: sh2;
		}
		h3 {
				counter-reset: sh3;
		}
		h3:before {
				content: ""counter(sh1)"." counter(sh2)"."counter(sh3)" ∙  ";
				counter-increment: sh3;
		}



		/**********************************************************

		// BASIC STYLE

**********************************************************/

		.title {
				margin: 0px 0px;
		}

		h1, h2, h3, h4, h5, h6 {
				color: ${cssVars.colors.main};
				margin-top: 0px;
		}
		h1 {
				margin-bottom: 20px;
		}
		h2, h3, h4, h5, h6 {
				margin-bottom: 15px;
		}

    img,
    .content-image {
        ${cssVars.els.images}
    }

    p {
        margin-top: 0px;
        margin-bottom: 1em;
    }


		/**********************************************************

		// LIST

**********************************************************/

		ul {
				padding: 0px;
				list-style-image: "./custom_icons/view-1.svg"; 
				list-style: none; 
		}

		ul li {
				background-image: url(./custom_icons/line.svg);
				background-repeat: no-repeat;
				background-position: -3px 4px;
				background-size: 11px;
				padding-left: 12px;
		}
		ul li p {
				margin: 0px;
		}

		ul input[type=checkbox] {
				position: relative;
				width: 0px;
				height: 10px;
				margin-right: 9px
		}
		ul input[type=checkbox]:before {
				content: "";
				display: block;
				position: absolute;
				width: 15px;
				height: 15px;
				top: 0px;
				left: -4px;
				background-image: url(./custom_icons/check.svg);
				background-repeat: no-repeat;
				background-position: -2px -1px;
				background-size: contain;
		}
		ul input[type=checkbox]:checked:before {
				background-image: url(./custom_icons/uncheck.svg);
		}

		/**********************************************************

		 PREVIEW LINK

**********************************************************/

		.preview-link {							
				font-weight: 800;
				background-repeat: no-repeat;
				background-position: 4px 2px;
				padding-left: 20px;
				background-size: 10px;
		}

		${d.pl}.external-link {
				background-image: url(${cssVars.assets.worldIcon});
		}
		${d.pl}.search-link {
				color: ${cssVars.colors.main};
				background-image: url(${cssVars.assets.searchIcon});
		}
		${d.pl}.title-search-link {
				color: ${cssVars.colors.main};
				background-image: url(${cssVars.assets.linkIcon});
				cursor: pointer;
		}
		${d.pl}.resource-link {
				color: ${cssVars.colors.main};
		} 

		/**********************************************************

		// TABLE

**********************************************************/

		table {
				margin: 10px 0px;
				padding 15px;
				border-spacing: 0;
				border-collapse: collapse;
		}

		tr:first-child th:first-child { border-top-left-radius: 10px; }
		tr:first-child th:last-child { border-top-right-radius: 10px; }
		tr:last-child td:first-child { border-bottom-left-radius: 10px; }
		tr:last-child td:last-child { border-bottom-right-radius: 10px; }

		th {
				text-align: left;
				padding: 10px 10px;
		}
		td {
				padding: 5px 10px;
		}
		thead tr {
				background: #CCC
		}
		tbody {
				tr:nth-child(even) {background: #CCC}
				tr:nth-child(odd) {background: #EEE}
		}

		/**********************************************************

		// RESSOURCE LINK

**********************************************************/

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

		${d.r}.epub, ${d.r}.cbr, ${d.r}.cbz,${d.r}.mobi, ${d.r}.azw, ${d.r}.azw3, ${d.r}.iba { background-image: url(${cssVars.assets.bookIcon}); }
		${d.r}.pdf
		{ background-image: url(${cssVars.assets.pdfIcon}); }

		${d.r}.xls, ${d.r}.xlsm, ${d.r}.xlsx, ${d.r}.ods
		{ background-image: url(${cssVars.assets.excelIcon}); }

		${d.r}.avi, ${d.r}.flv, ${d.r}.h264, ${d.r}.m4v, ${d.r}.mov, ${d.r}.mp4, ${d.r}.mpg, ${d.r}.mpeg, ${d.r}.rm, ${d.r}.swf, ${d.r}.vob, ${d.r}.wmv, ${d.r}.mkv
		{ background-image: url(${cssVars.assets.videoIcon}); }

		${d.r}.d7z, ${d.r}.arj, ${d.r}.deb, ${d.r}.rar, ${d.r}.gz, ${d.r}.zip, ${d.r}.rpm, ${d.r}.pkg
		{ background-image: url(${cssVars.assets.archiveIcon});}

		${d.r}.aif, ${d.r}.mp3, ${d.r}.cda, ${d.r}.mid, ${d.r}.mpa, ${d.r}.ogg, ${d.r}.wav, ${d.r}.wpl, ${d.r}.wma, ${d.r}.midi
		{ background-image: url(${cssVars.assets.audioIcon}); }

		${d.r}.doc, ${d.r}.docx, ${d.r}.odt
		{ background-image: url(${cssVars.assets.wordIcon}); }

		${d.r}.bin, ${d.r}.dmg, ${d.r}.iso, ${d.r}.toast, ${d.r}.vcd
		{
				top: 19px;
				transform: scale(1.8);
				background-image: url(${cssVars.assets.diskIcon});
		}

		${d.r}.ppt, ${d.r}.pptx, ${d.r}.odp, ${d.r}.key, ${d.r}.pps
		{ background-image: url(${cssVars.assets.presIcon}); }


		pre  {
		}

		pre code {
				display: block;
				border-radius: 8px;
				background: #d2d2d2;
				padding: 11px 23px;
		}
		`
		return css
}

export const previewAreaCss = () => `
.preview-area-wrapper {
    overflow: ${isIpad() ? 'scroll' : isA('mobile') ? 'scroll' : 'hidden'};
    height: ${isA('desktop') ? '100vh' : '100vh'};
    margin-top: ${isA('desktop') ? '140' : '0'}px;
}
.preview-area {
    position: relative;
    display: block;

    ${commonCssEditors}

		${previewAreaSimpleCss()}

		.tag-iframe {
				width: calc(100% - 6px);
				border: 2px #eaeaea solid;
				border-radius: 5px;
		}


    .infos-preview-wrapper {
        display: ${isA('desktop') ? 'none' : 'block'};
    }

}
`
