import { clamp, each, random } from 'lodash-es';
import React, { Ref, useContext, useEffect, useRef, useState } from 'react';
import { iFile } from '../../../../shared/types.shared';
import { deviceType, isA } from '../../managers/device.manager';
import { iContentChunk, noteApiFuncs } from '../../managers/renderNote.manager';
import { cssVars } from '../../managers/style/vars.style.manager';
import { commonCssEditors } from './EditorArea.component';
import { ContentBlock, onIframeMouseWheelFn } from '../ContentBlock.component';
import { syncScroll3 } from '../../hooks/syncScroll.hook';
import { ressourcePreviewSimpleCss } from '../RessourcePreview.component';
import { noteLinkCss } from '../../managers/codeMirror/noteLink.plugin.cm';
import { getFontSize } from '../../managers/font.manager';
import { filterMetaFromFileContent } from '../../managers/headerMetas.manager';



export const PreviewArea = (p: {
	windowId: string
	file: iFile
	posY: number
	height?: number
	reactOnHeightResize?: boolean
	fileContent: string
	onMaxYUpdate: (maxY: number) => void
	yCnt: number
	onIframeMouseWheel: onIframeMouseWheelFn
}) => {

	// const api = useContext(ClientApiContext);

	const previewAreaRefs = {
		wrapper: useRef<HTMLDivElement>(null),
		main: useRef<HTMLDivElement>(null),
	}

	// remove meta header
	const [innerContent, setInnerContent] = useState('')
	useEffect(() => {
		// const nContent = filterMetaFromFileContent(p.fileContent).content
		// setInnerContent(nContent)
		const nContent = filterMetaFromFileContent(p.fileContent).content
		setInnerContent(p.fileContent)
	}, [p.fileContent])

	let currentFolderArr = p.file.path.split('/')
	currentFolderArr.pop()
	let currentFolder = currentFolderArr.join('/')

	useEffect(() => {
		setTimeout(() => {
			p.onMaxYUpdate(calculateYMax())
		}, 1000)
	}, [innerContent])


	const calculateYMax = () => {
		const d = previewAreaRefs.main.current
		const height = d?.clientHeight
		const max = height || 3000
		return max * 2
	}

	const calculateYPos = () => {
		const max = calculateYMax();
		/* const offsetY = -100 */
		const offsetY = 0
		const pY = p.posY + offsetY
		const res = clamp(pY, 0, max)
		return res
	}

	const [contentBlocks, setContentBlocks] = useState<iContentChunk[]>([])
	useEffect(() => {
		const blocks = noteApiFuncs.chunks.chunk(innerContent)
		setContentBlocks(blocks)

		// @2remove
		setTimeout(() => {
			noteApiFuncs.injectLogic({
				fileContent: innerContent,
				file: p.file
			})
		}, 100)


		setTimeout(() => {
			syncScroll3.updatePreviewDims(p.windowId)
			syncScroll3.updateScrollerDims(p.windowId)
			setTimeout(() => {
				syncScroll3.updatePreviewDims(p.windowId)
				syncScroll3.updateScrollerDims(p.windowId)
			}, 100)
		}, 100)

	}, [innerContent, p.file.path, p.windowId])


	// const getWindowHeight = (): number => {
	// 	if (p.height) return p.height
	// 	let res = 0
	// 	const el = document.querySelector(`.window-id-${p.windowId}`)
	// 	if (el) res = el.clientHeight
	// 	// if it is mobile, windows are sometimes hidden = height 0
	// 	if (deviceType() === "mobile" && res === 0) { res = document.body.clientHeight - 120 }
	// 	return res
	// }

	return (
		<div
			className={`preview-area-wrapper render-latex`}
			onWheelCapture={(e) => {
				// @ts-ignore
				//syncScroll2.syncPreviewOffset(p.windowId)
				// syncScroll3.onPreviewScroll(p.windowId)
				syncScroll3.scrollPreviewPx(p.windowId, e.deltaY)
			}}
		>
			<div
				className={`preview-area`}
				ref={previewAreaRefs.wrapper}
				style={{ bottom: calculateYPos() }}
			>
				<div className="preview-area-transitions">

					<div className="infos-preview-wrapper">
						<div className="file-path-wrapper">
							{p.file.path.replace(`/${p.file.name}`, '')}
						</div>

						<h1 className="title big-title">
							{p.file.name.replace('.md', '')}
						</h1>


					</div>

					<div className="content-blocks-wrapper">
						<div className="simple-css-wrapper">
							<div className="preview-area-full-height-content">
								{
									contentBlocks.map((block, i) =>
										<ContentBlock
											key={i}
											index={i}
											block={block}
											windowId={p.windowId}
											file={p.file}
											// windowHeight={getWindowHeight()}
											reactOnHeightResize={p.reactOnHeightResize}
											yCnt={p.yCnt}
											onIframeMouseWheel={p.onIframeMouseWheel}
										/>
									)
								}
							</div>
						</div>

					</div>
				</div>

			</div>
		</div>
	)
}


export const previewAreaSimpleCss = (d?: any) => {

	if (!d) d = {
		w: '.simple-css-wrapper',
		pl: '.preview-link',
		r: '.resource-link-icon',
		separatorTitle: ". "

	}

	const css = `

		html, body {
				margin: 0px;
				padding: 0px;
		}

		${d.w} {
				color: ${cssVars.colors.editor.font};
				line-height: 19px;
				font-size:${getFontSize(+1)}px;
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

*********************************************************/

		${d.w} {
				overflow-wrap: break-word;
				counter-reset: sh1 ;
		}


		h1:before {
				content: ""counter(sh1)"${d.separatorTitle}";
				counter-increment: sh1;
		}
		h1 {
				counter-reset: sh2;
		}

		h2:before {
				content: ""counter(sh1)"." counter(sh2)"${d.separatorTitle}";
				counter-increment: sh2;
		}
		h2 {
				counter-reset: sh3;
		}

		h3:before {
				content: ""counter(sh1)"." counter(sh2)"."counter(sh3)"${d.separatorTitle}";
				counter-increment: sh3;
		}
		h3 {
		}



		/**********************************************************

		// BASIC STYLE

**********************************************************/

		a {
				color: ${cssVars.colors.main};
		}

		.main-color, .main-color:before, .main-color:after {
				color: ${cssVars.colors.main};
		}
		.title {
				margin: 0px 0px;
		}

		h1:before, h2:before, h3:before, h4:before, h5:before, h6:before {
				color: ${cssVars.colors.main};
		}
		h1, h2, h3, h4, h5, h6 {
				position:relative;
				color: ${cssVars.colors.main};
				margin-top: 0px;
				line-height: normal;
				margin-right: 10px;
		}
		h1:after,
		h2:after {
				// LONG LINE STYLE
				// content: "-";
				// background: ${cssVars.colors.main};
				// width: 100%;
				// height: 2px;
				// position: absolute;
				// bottom: 0px;
				// left: 0px;
				// font-size: 0px;
				/* opacity: 0.4; */
		}
		h2:after {
				/* width: 70%; */
				height: 1px;
		}
		h1 {
				padding: 0px;
				/* border-bottom: 2px solid; */
				margin-top: 0px;
				margin-bottom: 0px;
				text-decoration: underline;
				font-size: ${getFontSize(+6)}px;
		}
		h2 {
			/* border-bottom: 1px solid; */
			text-decoration: underline;
		}
		h1, h2, h3, h4, h5, h6 {
			margin-top: 3px;
			margin-bottom: 0px;
		}
		h2, h3, h4, h5, h6 {
				font-size: ${getFontSize(+4)}px;
				margin-bottom: 0px;
				margin-top: 0px;
		}

    img,
    .content-image {
				cursor: pointer;
    }
			.content-image-img {
					${cssVars.els().images}
					cursor: pointer;
			}

    p {
				//display: inline;
    }


		/**********************************************************

		// LIST

**********************************************************/
		.no-css ul li {
				background: none!important;
				padding: 0px;
		}

		ul {
				padding: 0px;
				// list-style-image: "./custom_icons/view-1.svg"; 
				// list-style: none; 
				margin-left: 20px;
				list-style: '- ';
		}

		ul li {
				padding-left: 12px;
		}
		ul li:before {
				// content: '-';
				// color: ${cssVars.colors.main};
				// width: 10px;
				// display: inline-block;
				// font-size: ${getFontSize(+5)}px;

				/* background-image: url(./custom_icons/line.svg); */
				/* background-repeat: no-repeat; */
				/* background-position: -3px 4px; */
				/* background-size: 11px; */

				/* background-image: url(./custom_icons/line.svg); */
				/* background-repeat: no-repeat; */
				/* background-color: ${cssVars.colors.main}; */
				/* -webkit-mask-position: -3px 4px; */
				/* -webkit-mask-size: 11px; */
				/* -webkit-mask-image: url(./custom_icons/line.svg); */
				/* -webkit-mask-repeat: no-repeat; */
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

				background-color: ${cssVars.colors.main};
				/* background-image: url(./custom_icons/check.svg); */
				/* background-repeat: no-repeat; */
				/* background-size: contain; */
				mask-position: -2px -1px;
				mask-image: url(./custom_icons/check.svg);
				mask-size: contain;
				mask-repeat: no-repeat;

				-webkit-mask-position: -2px -1px;
				-webkit-mask-image: url(./custom_icons/check.svg);
				-webkit-mask-size: contain;
				-webkit-mask-repeat: no-repeat;
		}
		ul input[type=checkbox]:checked:before {
				/* background-color: red; */
				/* -webkit-mask-image: url(./custom_icons/uncheck.svg); */
				/* mask-image: url(./custom_icons/uncheck.svg); */
				/* background-image: url(./custom_icons/uncheck.svg); */

				/* background-color: red; */
				/* -webkit-mask-image: url(./custom_icons/uncheck.svg); */
				/* mask-image: url(./custom_icons/uncheck.svg); */
				mask-image: url(./custom_icons/uncheck.svg);
				-webkit-mask-image: url(./custom_icons/uncheck.svg);

		}

		/**********************************************************

		 PREVIEW LINK

**********************************************************/


		${noteLinkCss(d.pl)}

		/**********************************************************

		// TABLE

**********************************************************/

		table {
				margin: 10px 0px;
				padding 15px;
				border-spacing: 0;
				border-collapse: collapse;
		}


		th {
				text-align: left;
				padding: 10px 10px;
		}
		td {
				padding: 5px 10px;
		}
		thead tr {
				background: #e4e3e3;
		}
		th, td {
				border: 1px solid #ccc;
		}
		tbody {
		}
		// tbody tr:nth-child(even) {background: #CCC}
		// tbody tr:nth-child(odd) {background: #EEE}

		/**********************************************************

		// RESSOURCE LINK

**********************************************************/
		${ressourcePreviewSimpleCss()}

		pre  {
		}

		pre code {
				display: block;
				border-radius: 8px;
				background: #d2d2d2;
				padding: 11px 23px;F
		}
		`
	return css
}

export const previewAreaCss = () => `


.preview-area {
		margin-top: 0px;
    	.infos-preview-wrapper {
				border-bottom: 1px solid rgba(0 0 0 / 5%);
        		display: ${isA('desktop') ? 'none' : 'block'};
				padding: 14px 0px 14px 0px;
		}
}
.preview-area {
    position: relative;
    display: block;
	overflow: auto; 
	width: ${deviceType() === "desktop" ? "calc(100% + 0px)" : "calc(100%)" } ; 
    padding-right: 30px;

	//@TODO padding preview area
	.content-block.block-text {
		padding-left: 10px;
		padding-right: 20px;
		display: block;
	}

    ${commonCssEditors()}

	.infos-preview-wrapper h1.big-title {
			width: calc(100% - 65px);
			font-family: ${cssVars.font.editor};
			color: grey;
			font-size: ${getFontSize(+5)}px;
			margin: 0px;
			padding: 0px 14px;
	}
}
.content-blocks-wrapper {
		${previewAreaSimpleCss()}
}
.view-both .preview-area {
		// margin-top: 20px;
		margin-top: 0px;
}

.preview-area-wrapper {
	height: calc(100% - 35px);
    margin-top: ${isA('desktop') ? '140' : '0'}px;
}

.preview-area, .preview-area-transitions, .content-blocks-wrapper, .simple-css-wrapper { height: 100%; }

`
