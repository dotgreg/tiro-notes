import React, { useState, useEffect, useRef, useContext } from 'react';
import { cloneDeep, each, filter } from 'lodash-es'
import GridLayout from "react-grid-layout";
import '../../../node_modules/react-grid-layout/css/styles.css'
import '../../../node_modules/react-resizable/css/styles.css'
import { iFile, iGrid, iViewType, iWindow, iWindowContent } from '../../../../shared/types.shared';
import { increment } from '../../../../shared/helpers/number.helper';
import { addNewWindowConfig, iWindowLayoutAndContent } from '../../hooks/app/tabs.hook';
import { useResize } from '../../hooks/useResize.hook';
import { WindowEditor } from './WindowEditor.component';
import { cssVars } from '../../managers/style/vars.style.manager';
import { ButtonsToolbar, iToolbarButton } from '../ButtonsToolbar.component';
import { calculateNewWindowPosAndSize, searchAlternativeLayout, updateLayout_onewindowleft_tofullsize, updateLayout_twowindows_to_equal } from '../../managers/draggableGrid.manager';
import { ClientApiContext, getApi } from '../../hooks/api/api.hook';
import { deviceType, isA, iMobileView } from '../../managers/device.manager';
import { iPinStatuses } from '../../hooks/app/usePinnedInterface.hook';
import { iLayoutUpdateFn } from '../dualView/EditorArea.component';
import { userSettingsSync } from '../../hooks/useUserSettings.hook';
import { setNoteView } from '../../managers/windowViewType.manager';



export const draggableGridConfig = {
	rows: 2,
	cols: 4
}

const d = {
	m: 10,
	rows: draggableGridConfig.rows,
	cols: draggableGridConfig.cols,
	decalBottom: 10
}

export const DraggableGrid = (p: {
	refresh: number
	grid: iGrid
	onGridUpdate: (grid: iGrid) => void
	mobileView: iMobileView
}) => {

	const [intContent, setIntContentInternal] = useState<iWindowContent[]>([])
	const setIntContent = (w:any) => {
		setIntContentInternal(w)
		intContentRef.current = w
	}
	const intContentRef = useRef<iWindowContent[]>([])
	const [intLayout, setIntLayout] = useState<iWindow[]>([])
	const lastGoodLayout = useRef<iWindow[]>();

	// ONLY WHEN TABID CHANGE
	// receiving different layout from parent
	useEffect(() => {
		if (!p.grid || !p.grid.layout) return
		setIntLayout(p.grid.layout)
		setIntContent(p.grid.content)
	}, [p.refresh])


	// on layout modification
	useEffect(() => {
		updateCanAdd();
		updateCanRemove();
	}, [intLayout])


	const onGridUpdate = (layout: iWindow[], content: iWindowContent[]) => {
		p.onGridUpdate({ layout, content })
	}


	//
	// ADDING LOGIC
	//
	const addNewWindow = () => {
		const copiedFile = intContent[0].file
		if (!copiedFile) return

		// calculate position new window to fill
		const dims = calculateNewWindowPosAndSize(intLayout)

		const nWindow = addNewWindowConfig({
			file: copiedFile,
			w: dims.w,
			h: dims.h,
			x: dims.x,
			y: dims.y,
		})
		const nLayout = cloneDeep(intLayout)
		nLayout.push(nWindow.layout)
		if (isItAllGoody(nLayout)) {
			setIntLayout(nLayout)

			// required to deplay the content update behind the layout because of react-grid...
			setTimeout(() => {
				const nContent = cloneDeep(intContent)
				nContent.push(nWindow.content)
				const nContent2 = makewindowActiveStatusInt(nWindow.content.i, nContent)
				setIntContent(nContent2)
				//1 
				onGridUpdate(nLayout, nContent2)
			});

			onGridUpdate(nLayout, intContent)
		}

	}

	//
	// REMOVING LOGIC
	//
	const [canRemove, setCanRemove] = useState(false)
	const updateCanRemove = () => {
		setCanRemove(intLayout.length > 1 ? true : false)
	}
	const removeWindow = (id: string) => {
		const nLayout = filter(cloneDeep(intLayout), window => window.i !== id)

		// if only one window left, make it fullsize
		const nLayout2 = updateLayout_onewindowleft_tofullsize(nLayout);

		setIntLayout(nLayout2)

		// required to deplay the content update behind the layout because of react-grid...
		setTimeout(() => {
			const nContent = filter(cloneDeep(intContent), c => c.i !== id)
			setIntContent(nContent)
			//2
			onGridUpdate(nLayout, nContent)
		});

		onGridUpdate(nLayout, intContent)
	}

	//
	// LIMIT ADDING LOGIC
	//
	const [canAdd, setCanAdd] = useState(false)
	const updateCanAdd = () => {
		// get all blocks
		let totalSize = 0
		let totalAllowedSize = d.cols * d.rows
		each(intLayout, window => {
			totalSize += window.w * window.h
		})
		// if all blocks > 6
		if (totalSize === totalAllowedSize) setCanAdd(false)
		else setCanAdd(true)
	}




	//
	// ACTIVE WINDOW LOGIC
	//
	const makewindowActiveStatusInt = (windowId: string, content: iWindowContent[]): iWindowContent[] => {
		const nContent = cloneDeep(content);
		each(nContent, c => {
			c.active = (c.i === windowId) ? true : false
		})
		return nContent
	}
	const makewindowActiveStatus = (windowId: string, file?: iFile) => {
		const nContent = makewindowActiveStatusInt(windowId, intContentRef.current)
		setIntContent(nContent)
		onGridUpdate(intLayout, nContent)
		// on window active toggle, update browser ui 
		// file && api?.ui.browser.goTo(file.folder, file.name)
	}

	//
	// LIMIT RESIZING LOGIC
	//
	const updateLayoutLogic = (newLayout: iWindow[]) => {
		//if (intLayout.length !== intContent.length) return
		const nlayout = cloneDeep(newLayout);
		if (isItAllGoody(nlayout)) {
			// const nlayout2 = updateLayout_twowindows_to_equal(nlayout)
			const nlayout2 = nlayout
			updateLastGood(nlayout2)
			setIntLayout(nlayout2)
			//4
			onGridUpdate(nlayout2, intContent)
		} else {
			if (!lastGoodLayout.current) return
			let altgoodLayout = searchAlternativeLayout(newLayout)
			if (altgoodLayout) updateLastGood(altgoodLayout)
			let goodLayout = altgoodLayout ? altgoodLayout : lastGoodLayout.current
			const nLayout = cloneDeep(goodLayout)
			each(nLayout, window => {
				window.refresh = increment(window.refresh)
			})
			setIntLayout(nLayout)
			onGridUpdate(nLayout, intContent)
		}
	}

	const updateLastGood = (nlayout: iWindow[]) => {
		lastGoodLayout.current = cloneDeep(nlayout)
	}

	// check if resizing new layout is good
	const isItAllGoody = (nlayout: iWindow[]): boolean => {
		let allGood = true
		for (let i = 0; i < nlayout.length; i++) {
			const el = nlayout[i];
			// should not be positionned below 1
			if (el.y > 1) allGood = false
			// if h is 2, y should be 0
			if (el.h > 1 && el.y > 0) allGood = false

		}
		return allGood;
	}

	//
	// RESIZING LOGIC
	//
	useResize();
	useEffect(() => {
		const e = divWrapper.current
		if (!e) return
		e.addEventListener('resize', () => {
		})

		return () => {
			e.removeEventListener('resize', () => {
			})
		}
	}, [])
	const divWrapper = useRef<HTMLDivElement>(null)
	const s = {
		width: 300,
		height: 300
	}
	const rh = () => (s.height / d.rows) - (d.m * (d.rows + 1))
	if (divWrapper.current) {
		s.width = divWrapper.current.clientWidth
		s.height = divWrapper.current.clientHeight - d.decalBottom
	}

	//
	// view change in editor
	//
	const viewTypeChange = (nview: iViewType, index: number) => {
		const nContent = cloneDeep(intContent);
		nContent[index].view = nview
		setIntContent(nContent);
		onGridUpdate(intLayout, nContent);
		// onGridUpdate(intLayout, nContent);
	}

	const api = useContext(ClientApiContext)
	// const refresh = api?.status.refresh.get
	// const [mobileWindow, setMobileWindow] = useState<iWindowLayoutAndContent | null>(null)
	// useEffect(() => {
	// 	// make mobile window
	// 	if (deviceType() === 'mobile') {
	// 		const activeWindow = api?.ui.windows.active.get()
	// 		// either the active one
	// 		if (activeWindow) setMobileWindow(activeWindow)
	// 		// the first one, then make that one active
	// 		else {
	// 			const first: iWindowLayoutAndContent = { layout: intLayout[0], content: intContent[0] }
	// 			if (first.layout && first.content && first.layout.i === first.content.i) {
	// 				setMobileWindow(first)
	// 				makewindowActiveStatus(first.content.i)
	// 			}
	// 		} 
	// 	}
	// }, [p.refresh])

	// const mobileWindowdow:  = {
	// 	layout: activeWindow?.layout,
	// 	content: activeWindow?.content
	// }


	// const onEditorDropdownEnter = (window) => {
	// 	if (window && !window.active) makewindowActiveStatus(window.i, window.file)
	// }

	const processLayoutUpdate = (window, i):iLayoutUpdateFn => (type, data) => {
		if (type === "windowActiveStatus") {
			if (window && !window.active) makewindowActiveStatus(window.i, window.file)
		} else if (type === "windowViewChange") {
			if (!data?.view || !p.grid.content[i].file) return
			viewTypeChange(data?.view, i)
			const filePath = p.grid.content[i].file?.path || ""
			setNoteView(filePath, data?.view)
			// console.log(filePath, window, i, type, data)
		}
	}

	
	

	const WindowTools = (window, i, content: iWindowContent) => {
		const btnsConfig:iToolbarButton[] = [
			{
				icon: 'faGripVertical',
				title: 'Move Window',
				class: 'drag-handle',
				size: 1.2,
				action: () => { },
				onHover: () => {
					if (window && !window.active) makewindowActiveStatus(window.i, window.file)
				}
			},
			{
				icon: 'faPlus',
				title: 'Add Window',
				class: 'add-button',
				action: () => { addNewWindow() }
			},
			{
				icon: 'faPlus',
				title: 'Delete Window',
				class: 'delete-button',
				action: () => { 
					removeWindow(window.i) 
				}
			},
			
		]

		// if (userSettingsSync.curr.beta_floating_windows) {
		// 	btnsConfig.unshift({
		// 		icon: 'window-restore',
		// 		title: 'Detach Window',
		// 		class: 'detach-button',
		// 		action: () => { 
		// 			console.log("detach", intContent[i].view, intContent[i])
		// 			if (!content.file) return
		// 			getApi(api => { api.ui.floatingPanel.create({type:"file", file: content.file, view: intContent[i].view === "preview" ? "preview" : "editor" }) })
		// 		}
		// 	})
		// }

		return ( 
			<>
				<div className="note-active-ribbon"></div>
				<div className={`window-buttons-bar ${canAdd ? 'can-add' : ''} ${canRemove ? 'can-remove' : ''}`}>
					<ButtonsToolbar
						design="horizontal"
						popup={false}
						buttons={btnsConfig}
						colors={["#d4d1d1", "#615f5f"]}
						size={0.8} />
				</div>
			</>
		)
	}

		


	// {intLayout.length}
	// {p.refresh}
	return (
		<div className='draggable-grid-wrapper'>

			<div className="draggable-grid-wrapper-in" ref={divWrapper}>
				{deviceType() !== 'mobile' &&
					<GridLayout
						className="draggable-grid"
						autoSize={false}
						layout={intLayout}
						onLayoutChange={updateLayoutLogic}
						cols={d.cols}
						compactType="horizontal"
						useCSSTransforms={false}
						rowHeight={rh()}
						draggableHandle=".drag-handle"
						width={s.width}
						margin={[d.m, d.m]}
					>

						{
							intLayout.map((window, i) =>
								<div
									key={window.i}
									className={` ${intContent[i] && intContent[i].active ? 'active' : ''} window-wrapper `}
									onClick={() => {
										// on click note, make it active if it is not
										if (intContent[i] && !intContent[i].active) {
											makewindowActiveStatus(intContent[i].i, intContent[i].file)
															
										}
									}}
									onMouseEnter={() => {
										// if (intContent[i] && !intContent[i].active) makewindowActiveStatus(intContent[i].i, intContent[i].file)

									}}
								>
									{WindowTools(window, i, p.grid.content[i])}

									<div className="window-editor-wrapper-wrapper">
										<WindowEditor
											content={p.grid.content[i] && p.grid.content[i]}
											forceView={p.grid.content[i] && p.grid.content[i].view}
											onLayoutUpdate={processLayoutUpdate(window,i)}
											mobileView={p.mobileView}
										/>
									</div>
								</div>
							)
						}
					</GridLayout>
				}

				{deviceType() === 'mobile' &&
					<div className="mobile-grid-view">
						<div className=" window-wrapper">
							<div className="window-editor-wrapper-wrapper">
								{p.grid.content[0] &&
									<WindowEditor 
										content={p.grid.content[0]}
										// onViewChange={(nView) => { viewTypeChange(nView, 0) }}
										onLayoutUpdate={processLayoutUpdate(window,0)}

										mobileView={p.mobileView}
									/>
								}
							</div>
						</div>
					</div>
				}

			</div >
		</div >
	)
}



export const GridMobileCss = () => `
.draggable-grid-wrapper 
.draggable-grid-wrapper-in 
.mobile-grid-view {
		.window-wrapper {

				.window-buttons-bar {
						display: none;
				}

				.window-editor-wrapper-wrapper {
						.dual-view-wrapper {
								.editor-area {
										margin-top: 47px;
										.infos-editor-wrapper {
												margin-top: 10px;
												top: -43px;
												.title-input-wrapper {
														input {
																color: ${cssVars.colors.main};
														}
												}
										}
										.dropdown-icon {
												top: -15px;
												right: 10px;
										}
										.context-menu {
												right: 10px;
										}
										.main-editor-wrapper {
												.textarea-editor {
														height: calc(100% - 300px);
														padding: 20px 20px 70px 20px;
														width: calc(100% - 40px);
														resize: none;
												}
										}
								}
								.preview-area-wrapper {
										// height: calc(100% - 165px);
										height: calc(100% - 85px);
										.preview-area {
												top: 0px!important;
												bottom: 0px!important;
												.dates-wrapper {
												}
												.preview-content {
														padding: 0px 0px 50px 0px;
												}
										}
								}
								.scrolling-bar-wrapper {
										display:none;
								}
						}
				}
		}
}
`

export const draggableGridCss = (pinStatus:iPinStatuses) => `

.draggable-grid-wrapper {
		// remove transition

		height: calc(100% + ${pinStatus.topTab ? "0" : "44"}px);
		top: ${pinStatus.topTab && deviceType() !== "mobile" ? "44" : "0"}px;
		position: relative;

		.react-grid-item {
				transition: all 0ms ease;
				transition-property: left, top;
				.react-resizable-handle {
						bottom: 0px;
						right: 0px;
						cursor: se-resize;
						opacity: 1;
						width: 10px;
						height: 18px;
						background: rgb(247,247,247);
				}
				.react-resizable-handle:after {
						top: 5px;
						left: 1px;
						opacity: 0.3;
				}
		}

		.draggable-grid-wrapper-in {
				height: 100%;
				position: relative;

				.draggable-grid, .mobile-grid-view {
						height: 100%;
						width: 100%;
						.window-wrapper {
							//overflow: hidden;
							border-radius: 5px;
							color: ${cssVars.colors.fontEditor};
							background: ${cssVars.colors.bgEditor};
							box-shadow: 0px 0px 5px rgba(0,0,0,.1);
							overflow-y: hidden;
							overflow-x: hidden;
							height:100%;

							.window-buttons-bar {
								position: absolute;
								z-index:3;
								right: 30px;
								top: 8px;
								.delete-button {display: none;}
								.add-button {display: none;}
								.drag-handle {
										cursor: grab;
								}
								.delete-button svg {
										transform: rotate(45deg);
								}
								&.can-add {
										.add-button {display: block;}
								}
								&.can-remove {
										.delete-button {display: block;}
								}
							}

							&.active {
								.note-active-ribbon {
										//background:${cssVars.colors.main};
								}
								.dual-view-wrapper
								.editor-area
								.infos-editor-wrapper
								.title-input-wrapper
								.big-title {
										color: ${cssVars.colors.main};
				
								}
							}
					}
				}
		}

		
}
`
