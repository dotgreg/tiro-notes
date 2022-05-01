import { clamp } from 'lodash';
import React, { Ref, useEffect, useRef, useState } from 'react';
import { iFile } from '../../../../shared/types.shared';
import { addCliCmd } from '../../managers/cliConsole.manager';
import { formatDateList } from '../../managers/date.manager';
import { deviceType, isA, isIpad, MobileView } from '../../managers/device.manager';
import { transformLatex } from '../../managers/latex.manager';
import { md2html, replaceUserCustomMdTag } from '../../managers/markdown.manager';
import { transformMarkdownScripts } from '../../managers/scriptsInMarkdown.manager';
import { cssVars } from '../../managers/style/vars.style.manager';
import { transformSearchLinks, transformImagesInHTML, transformRessourcesInHTML, transformUrlInLinks, transformTitleSearchLinks } from '../../managers/textProcessor.manager';
import { commonCssEditors } from './EditorArea.component';



export const PreviewArea = (p: {
	file: iFile,
	posY: number,
	fileContent: string
	onMaxYUpdate: (maxY: number) => void
}) => {

	const previewAreaRefs = {
		wrapper: useRef<HTMLDivElement>(null),
		main: useRef<HTMLDivElement>(null),
	}

	let currentFolderArr = p.file.path.split('/')
	currentFolderArr.pop()
	let currentFolder = currentFolderArr.join('/')

	useEffect(() => {
		// @ts-ignore
		window.previewHtmlOutput = '';
	}, [p.file.path])

	useEffect(() => {
		p.onMaxYUpdate(calculateYMax())
		setTimeout(() => {
			p.onMaxYUpdate(calculateYMax())
		}, 1000)
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

	const renderNoteContent = (raw: string): string => {
		return md2html(
			transformRessourcesInHTML(currentFolder,
				transformImagesInHTML(currentFolder,
					transformSearchLinks(
						transformTitleSearchLinks(
							transformUrlInLinks(
								transformMarkdownScripts(
									replaceUserCustomMdTag(
										transformLatex(
											raw
										)))))))))
	}

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

				<div id='preview-script-area'></div>
				<div
					className='preview-content'
					ref={previewAreaRefs.main}
					dangerouslySetInnerHTML={{ __html: renderNoteContent(p.fileContent) }}>
				</div>

			</div>
		</div>
	)
}


export const previewAreaCss = (v: MobileView) => `
.preview-area-wrapper {
    overflow: ${isIpad() ? 'scroll' : isA('mobile') ? 'scroll' : 'hidden'};
    height: ${isA('desktop') ? '100vh' : '100vh'};
    margin-top: ${isA('desktop') ? '140' : '0'}px;
}
.preview-area {
    position: relative;
    display: ${isA('desktop') ? 'block' : (v === 'editor' ? 'none' : 'block')};
    // overflow: ${isIpad() ? 'scroll' : 'hidden'};

    ${commonCssEditors}

    .infos-preview-wrapper {
        display: ${isA('desktop') ? 'none' : 'block'};
    }

    .mobile-buttons-up-down {
        position: fixed;
        &.right {
            right: 0px;
        }
        &.left {
            left: 0px;
        }
        top: 50%;
        div {
            background: #d6d6d6;
            padding: 15px;
            opacity: 0.5;
            color:white;
            cursor: pointer;
        }
    }

    .title {
        margin: 0px 0px;
    }

    .dates-wrapper {
        margin-bottom: ${cssVars.sizes.block}px;
    }

    color: ${cssVars.colors.editor.font};
    h1, h2, h3, h4, h5, h6 {
        color: ${cssVars.colors.main};
    }
    .preview-link {
      font-weight: 800;
      
      background-repeat: no-repeat;
      background-position: 4px 2px;
      padding-left: 20px;
      background-size: 10px;
      
      &.external-link {
        background-image: url(${cssVars.assets.worldIcon});
        }
        &.search-link {
            color: ${cssVars.colors.main};
            background-image: url(${cssVars.assets.searchIcon});
        }
        &.title-search-link {
            color: ${cssVars.colors.main};
            background-image: url(${cssVars.assets.linkIcon});
        }
        &.resource-link {
          color: ${cssVars.colors.main};
      }
    }

		.resource-link-wrapper {
				background: #f7f6f6;
				padding: 20px;
				border-radius: 10px;
				position: relative;
				margin: 5px 0px;

				.resource-link-icon {
						background-image: url(${cssVars.assets.fileIcon});
						&.epub, &.cbr, &.cbz,&.mobi, &.azw, &.azw3, &.iba,  
						{ background-image: url(${cssVars.assets.bookIcon}); }
						&.pdf
						{ background-image: url(${cssVars.assets.pdfIcon}); }

						&.xls, &.xlsm, &.xlsx, &.ods
						{ background-image: url(${cssVars.assets.excelIcon}); }

						&.avi, &.flv, &.h264, &.m4v, &.mov, &.mp4, &.mpg, &.mpeg, &.rm, &.swf, &.vob, &.wmv, &.mkv
						{ background-image: url(${cssVars.assets.videoIcon}); }

						&.d7z, &.arj, &.deb, &.rar, &.gz, &.zip, &.rpm, &.pkg
						{ background-image: url(${cssVars.assets.archiveIcon});}

						&.aif, &.mp3, &.cda, &.mid, &.mpa, &.ogg, &.wav, &.wpl, &.wma, &.midi
						{ background-image: url(${cssVars.assets.audioIcon}); }

						&.doc, &.docx, &.odt
						{ background-image: url(${cssVars.assets.wordIcon}); }

						&.bin, &.dmg, &.iso, &.toast, &.vcd
						{
								top: 19px;
								transform: scale(1.8);
								background-image: url(${cssVars.assets.diskIcon});
						}

						&.ppt, &.pptx, &.odp, &.key, &.pps
						{ background-image: url(${cssVars.assets.presIcon}); }

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
				}
				.resource-link {
				}
		}


    img,
    .content-image {
        ${cssVars.els.images}
    }


    p {
        margin-top: 0px;
        margin-bottom: 1em;
    }
    .preview-content {
	counter-reset: sh1;
			overflow-wrap: break-word;

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

				ul {
						list-style-image: "./custom_icons/view-1.svg"; 
						list-style: none; 
						li {
								background-image: url(./custom_icons/line.svg);
								background-repeat: no-repeat;
								background-position: -3px 4px;
								background-size: 11px;
								padding-left: 12px;
						}
input[type=checkbox] {
		position: relative;
		width: 0px;
		height: 10px;
		margin-right: 9px
}
input[type=checkbox]:before {
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
input[type=checkbox]:checked:before {
background-image: url(./custom_icons/uncheck.svg);
}
				}

				table {
						margin: 10px 0px;
						padding 15px;
						border-spacing: 0;
						border-collapse: collapse;

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
				}
    }
    pre {
      code {
        display: block;
        border-radius: 8px;
        padding: 10px;
      }
    }
  }
`



const PreviewRenderer = React.memo((p: { filecontent: string, currentFolder: string }) => {


	return (
		<>
		</>

	)
})
