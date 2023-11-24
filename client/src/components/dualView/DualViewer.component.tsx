import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { PreviewArea } from './PreviewArea.component'
import { EditorArea, iLayoutUpdateFn, onFileEditedFn, onLightboxClickFn, onSavingHistoryFileFn } from './EditorArea.component';
import { iFile, iTitleEditorStatus, iViewType } from '../../../../shared/types.shared';
import { syncScroll2, syncScroll3 } from '../../hooks/syncScroll.hook';
import { deviceType, isMobile, iMobileView } from '../../managers/device.manager';
import { clamp, debounce, each, isNumber, random, throttle } from 'lodash';
import { ScrollingBar } from './Scroller.component';
import { ClientApiContext, getApi } from '../../hooks/api/api.hook';
import { useDebounce, useThrottle } from '../../hooks/lodash.hooks';
import { getMdStructure, iMdPart } from '../../managers/markdown.manager';
import { iEditorAction } from '../../hooks/api/note.api.hook';
import { cssVars } from '../../managers/style/vars.style.manager';
import { stopDelayedNotePreview } from '../../managers/codeMirror/noteLink.plugin.cm';
import { iCMPluginConfig } from './CodeMirrorEditor.component';
import { iPinStatuses } from '../../hooks/app/usePinnedInterface.hook';

export type onViewChangeFn = (nView: iViewType) => void
interface iDualViewProps {
	windowId: string
	file: iFile
	fileContent: string
	isActive: boolean
	canEdit: boolean
	isDragging?: boolean

	showViewToggler?: boolean
	showToolbar?: boolean
	titleEditor?: iTitleEditorStatus

	viewType?: iViewType
	mobileView?: iMobileView

	onFileEdited: onFileEditedFn
	onLayoutUpdate: iLayoutUpdateFn
	pluginsConfig?: iCMPluginConfig
}

const DualViewerInt = (
	p: iDualViewProps & { 
		editorAction: iEditorAction | null
	}
) => {


	const [previewContent, setPreviewContent] = useState('')

	// calculate max Y for custom scroller bar
	const [maxY, setMaxY] = useState(0)
	const maxYRef = useRef(0)
	const updateMaxY = (newMaxY: number) => {
		if (newMaxY > maxYRef.current) maxYRef.current = newMaxY
		setMaxY(maxYRef.current)
	}


	useEffect(() => {
		setMaxY(0)
	}, [p.fileContent, p.windowId])

	// calculate percent scrolled by natural scroll
	// const [percentScrolled, setPercentScrolled] = useState(0)
	// const { getSyncY, setSyncY, yCnt, updateSyncYWithDelta } = useSyncScroll(maxY)


	// useEffect(() => {
	// 	// setPercentScrolled(fromPxToPercentY(getSyncY()));
	// 	onSyncScroll()
	// }, [yCnt, maxY])

	// const fromPxToPercentY = (nPx) => clamp(Math.round((nPx / maxY) * 100), 0, 100);
	// const fromPercentToPxY = (nPercent) => (nPercent / 100) * maxY


	//
	// PREVIEW UPDATE : debounced for perfs
	//
	let debounceUpdatePreview = useDebounce((nt) => {
		setPreviewContent(nt)
	}, isMobile() ? 3000 : 1000)
	let throttleUpdatePreview = useThrottle((nt) => {
		setPreviewContent(nt)
	}, 1000)
	const updatePreviewContent = (nText) => {
		// debounceUpdatePreview(nText)
		// throttleUpdatePreview(nText)
		setPreviewContent(nText)
	}
	useEffect(() => {
		updatePreviewContent(p.fileContent)
	}, [p.fileContent, p.file.path, p.windowId])



	// KEEP POSITION ON TAB TOGGLING
	useEffect(() => {
		setTimeout(() => {
			syncScroll3.onWindowLoad(p.windowId)
		}, 500)
	}, [p.file.path, p.windowId])
	
	// Close any popup on note switch
	useEffect(() => {
		stopDelayedNotePreview(true)
	}, [p.file.path, p.windowId])

	





	///////////////////////////////////////
	// DIFFERENT SCROLLS
	// get information on currently scrolled line
	// to update preview scroll position on preview-scroll: follow-title
	//

	// 2) TITLES SCROLL
	const initTitle = { id: "", line: 0, title: "" }
	const updateScrolledTitleInt = (scrolledLine: number) => {
		// if (scrollMode !== "title") return;
		const struct = getMdStructure(previewContent)
		// get current title
		let cTitle: iMdPart = initTitle
		each(struct, title => { if (scrolledLine >= title.line) cTitle = title })
		// update the preview scroll accordingly
		if (cTitle.id !== "") {
			const ePath = `.window-id-${p.windowId} #t-${cTitle.id}`
			try {
				// let isViewWithMap = document.querySelector(`.window-id-${p.windowId}.view-editor-with-map`)
				// @ts-ignore
				let etop = document.querySelector(ePath)?.offsetTop
				if (isNumber(etop)) {
					syncScroll3.updatePreviewOffset(p.windowId, etop)
					syncScroll3.scrollPreview(p.windowId)
				}
			} catch (e) {
				console.error(e);
			}
		}
	}
	const t1 = useThrottle(updateScrolledTitleInt, 200)
	const t2 = useDebounce(updateScrolledTitleInt, 500)

	const updateScrolledTitle = (newLine) => {
		t1(newLine)
		t2(newLine)
	}

	// const [scrollerPos, setScrollerPos] = useState(0)
	let isEditor = (deviceType() === "desktop" && p.viewType === "editor") || (deviceType() !== "desktop" && p.mobileView === "editor")

	
	//
	// overlay loading
	//
	const [forceCloseOverlay, setForceCloseOverlay] = useState(false)
	useEffect(() => {
		setForceCloseOverlay(false)
		// console.log('canedit', p.canEdit);
	}, [p.canEdit])

	

	return <div
		className={`dual-view-wrapper view-${p.viewType} device-${deviceType()} window-id-${p.windowId} window-id-sizeref-${p.windowId}`}
	>
		{(!p.canEdit && !forceCloseOverlay) && 
			<div className='loading-overlay' onClick={e => {setForceCloseOverlay(true)}}> 
				<div className="loading-text">loading...</div> 
			</div>
		}
		
		{(p.isDragging) && 
			<div className='loading-overlay' onClick={e => {setForceCloseOverlay(true)}}> 
				<div className="loading-text"> drop to upload</div> 
			</div>
		}
		
		
		<EditorArea
			viewType={p.viewType}
			mobileView={p.mobileView}
			windowId={p.windowId}
			editorType='codemirror'
			showViewToggler={p.showViewToggler}
			showToolbar={p.showToolbar}
			titleEditor={p.titleEditor}

			file={p.file}
			canEdit={p.canEdit}
			fileContent={p.fileContent}
			isActive={p.isActive}

			editorAction={p.editorAction}
			posY={0}

			onTitleClick={newLine => {
				updateScrolledTitle(newLine)
			}}
			onScroll={percent => {
				// setScrollerPos(percent)
			}}
			onUpdateY={newY => {
				// setSyncY(newY)
			}}
			onMaxYUpdate={updateMaxY}
			onFileEdited={(path, content) => {
				p.onFileEdited(path, content)
				// setPreviewContent(content)
				updatePreviewContent(content)

			}}
			onScrollModeChange={checked => {
				// const res = checked ? "title" : "sync"
				// setScrollMode(res)
			}}
			onLayoutUpdate={p.onLayoutUpdate}

			pluginsConfig={p.pluginsConfig}
		/>
		
		{!isEditor &&
			<PreviewArea
				windowId={p.windowId}
				file={p.file}
				// posY={previewY}
				posY={0}
				fileContent={previewContent}
				onMaxYUpdate={updateMaxY}
				// yCnt={yCnt}
				yCnt={0}
				onIframeMouseWheel={e => {
					// updateSyncYWithDelta(e.deltaY)
				}}
			/>
		}


		<ScrollingBar
			windowId={p.windowId}
		// onScroll={(percent: number) => {
		//syncScroll2.scrollerScroll(p.windowId)
		// }}
		/>

	</div>
}

export const dualViewerCss = (mobileView:iMobileView, pinStatus:iPinStatuses) => `
	.dual-view-wrapper {
		position: relative;
		.loading-overlay {
			.loading-text {
				color: ${cssVars.colors.main};
			}

			display: flex;
			align-content: center;
			justify-content: center;
			align-items: center;
			width: 100%;
			height: 120%;
			position: absolute;
			background: rgba(0,0,0,0.1);
			top: -2px;
			left: 0px;
			z-index: 99;
			font-weight: bold;
			color: white;
		}
	}

	.mobile-view-preview {
		
		.editor-area {
			display: none;
		}
	}
	
	.dual-view-wrapper.device-tablet, 
	.dual-view-wrapper.device-mobile {
			.editor-area,
			.preview-area-wrapper {
					width: 100%;
			}
	}
	.dual-view-wrapper {
			&.view-both.device-desktop {
					.preview-area-wrapper {
							width: 50%;
					}
			}



			.__EDITOR_DESIGN HERE__ {}
			&.view-editor.device-desktop {
					.editor-area {
							width: 100%;
					}

					.preview-area-wrapper {
							/* display:none; */
							position: absolute;
							width: 10px;
							left: -9999px;
							top: -9999px;

					}
			}

			&.view-editor-with-map.device-desktop {
					.editor-area {
							width: 80%;
					}

					.__MINIMAP_DESIGN HERE__ {}

					.preview-area-wrapper:hover {
							height: calc(100% - 30px);
							transform: scale(1);
							right: -50%;
							opacity: 1;
							box-shadow: -4px 5px 10px rgba(0, 0, 0, 0.10);
							.preview-area-transitions {
									width: 50%;
									padding: 0px;
							}
					}
					.preview-area-wrapper {
							transition-delay: ${cssVars.anim.time};
							/* transition-delay: 0ms; */
							/* transition-property: bottom; */
							word-break: break-word;
							transform: scale(0.2) translateZ(0);
							transform-origin: 0px 0px;
							position: absolute;
							width: 100%;
							right: calc(-80%);
							// height: 500vh;
							height: calc(100% * 5);
							.preview-area-transitions {

									/* transition-delay: 0ms; */
									/* transition-property: bottom; */

									/* transition-delay:${cssVars.anim.time};  */
									/* transition-property: padding; */

									transition-delay:${cssVars.anim.time}; 
									/* transition-property: all; */

									/* transition-delay: 0ms; */
									/* transition-property: bottom; */

									width: 73%;
									padding: 80px;
									padding-right: 140px;
									padding-left: 40px;
							}
					}
			}

			&.view-preview.device-desktop {
					.editor-area {
							width: 0%;
							.main-editor-wrapper {
									position: absolute;
									left: -9999px;
							}
					}
					.preview-area-wrapper {
							width: 100%;
							.preview-area {
							}
					}
			}

			position:relative;
			display: ${deviceType() === 'desktop' ? 'flex' : 'block'};
	}
	
`

export const DualViewer = (p: iDualViewProps) => {
	const api = useContext(ClientApiContext);
	const editorAction = api?.ui.note.editorAction.get || null
	return <DualViewerInt {...p} editorAction={editorAction} />
}

