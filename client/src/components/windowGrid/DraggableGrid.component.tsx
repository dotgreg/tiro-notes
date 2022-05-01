import React, { useState, useEffect, useRef } from 'react';
import { cloneDeep, each, filter } from 'lodash'
import GridLayout from "react-grid-layout";
import '../../../node_modules/react-grid-layout/css/styles.css'
import '../../../node_modules/react-resizable/css/styles.css'
import { iGrid, iViewType, iWindow, iWindowContent } from '../../../../shared/types.shared';
import { increment } from '../../../../shared/helpers/number.helper';
import { addNewWindowConfig } from '../../hooks/app/tabs.hook';
import { useResize } from '../../hooks/useResize.hook';
import { WindowEditor } from './WindowEditor.component';
import { cssVars } from '../../managers/style/vars.style.manager';
import { ButtonsToolbar } from '../ButtonsToolbar.component';
import { calculateNewWindowPosAndSize, searchAlternativeLayout } from '../../managers/draggableGrid.manager';



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
}) => {

	const [intContent, setIntContent] = useState<iWindowContent[]>([])
	const [intLayout, setIntLayout] = useState<iWindow[]>([])
	const lastGoodLayout = useRef<iWindow[]>();

	// ONLY WHEN TABID CHANGE
	// receiving different layout from parent
	useEffect(() => {
		if (!p.grid || !p.grid.layout) return
		setIntLayout(p.grid.layout)
		setIntContent(p.grid.content)
	}, [p.refresh])



	// on content modification, mainly active state toggling
	/* useEffect(() => {
		p.onGridUpdate({ layout: intLayout, content: intContent })
	}, [intContent])
 */
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
				const nContent2 = makeWindowActiveInt(nWindow.content.i, nContent)
				setIntContent(nContent2)
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
		console.log(666, intLayout.length);
		setCanRemove(intLayout.length > 1 ? true : false)
	}
	const removeWindow = (id: string) => {
		const nLayout = filter(cloneDeep(intLayout), window => window.i !== id)
		setIntLayout(nLayout)

		// required to deplay the content update behind the layout because of react-grid...
		setTimeout(() => {
			const nContent = filter(cloneDeep(intContent), c => c.i !== id)
			setIntContent(nContent)
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
	const makeWindowActiveInt = (windowId: string, content: iWindowContent[]): iWindowContent[] => {
		const nContent = cloneDeep(content);
		each(nContent, c => {
			c.active = (c.i === windowId) ? true : false
		})
		return nContent
	}
	const makeWindowActive = (windowId: string) => {
		const nContent = makeWindowActiveInt(windowId, intContent)
		setIntContent(nContent)
		onGridUpdate(intLayout, nContent)
	}

	// 
	// LIMIT RESIZING LOGIC
	// 
	const updateLayoutLogic = (newLayout) => {
		//if (intLayout.length !== intContent.length) return
		console.log('0035', 111, newLayout);
		const nlayout = cloneDeep(newLayout);
		if (isItAllGoody(nlayout)) {
			setIntLayout(nlayout)
			updateLastGood(nlayout)
			onGridUpdate(nlayout, intContent)
		} else {
			if (!lastGoodLayout.current) return
			let altgoodLayout = searchAlternativeLayout(newLayout)
			if (altgoodLayout) updateLastGood(altgoodLayout)
			let goodLayout = altgoodLayout ? altgoodLayout : lastGoodLayout.current
			console.log('00351', goodLayout);
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
		console.log("0013", nlayout, allGood);
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
	}

	return (
		<div className='draggable-grid-wrapper'>
			<div className="draggable-grid-wrapper" ref={divWrapper}>
				<GridLayout
					className="draggable-grid"
					autoSize={false}
					layout={intLayout}
					onLayoutChange={updateLayoutLogic}
					cols={d.cols}
					compactType="horizontal"
					useCSSTransforms={true}
					rowHeight={rh()}
					draggableHandle=".drag-handle"
					width={s.width}
					margin={[d.m, d.m]}
				>
					{
						intLayout.map((window, i) =>
							<div
								key={window.i}
								className={`${intContent[i] && intContent[i].active ? 'active' : ''} window-wrapper`}
								onClick={() => {
									if (intContent[i] && !intContent[i].active) makeWindowActive(intContent[i].i)
								}}
							>

								<div className="note-active-ribbon"></div>

								<div className={`window-buttons-bar ${canAdd ? 'can-add' : ''} ${canRemove ? 'can-remove' : ''}`}>
									<ButtonsToolbar
										design="horizontal"
										popup={false}
										buttons={[
											{
												icon: 'faGripVertical',
												title: 'Move Window',
												class: 'drag-handle',
												action: () => { }
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
												action: () => { removeWindow(window.i) }
											}
										]}
										colors={["#d4d1d1", "#615f5f"]}
										size={0.8} />
								</div>


								<div className="note-wrapper">
									<WindowEditor
										file={intContent[i] && intContent[i].file}
										view={intContent[i] && intContent[i].view}
										onViewChange={(nView) => { viewTypeChange(nView, i) }}
									/>
								</div>
							</div>
						)
					}
				</GridLayout>
			</div >
		</div >
	)
}

export const draggableGridCss = `
.draggable-grid-wrapper {
		// remove transition
		.react-grid-item {
				transition: all 0ms ease;
				transition-property: left, top;
		}

		height: 100%;
		.draggable-grid-wrapper {
				height: 100%;
				position: relative;
				.draggable-grid {
						height: 100%;
						width: 100%;
						height: 100%;
						.window-wrapper {
								//overflow: hidden;
								border-radius: 5px;
								background: white;
								box-shadow: 0px 0px 5px rgba(0,0,0,.1);
								overflow-y: hidden;
								overflow-x: hidden;
								height:100%;

								// height 100% everywhere
								.note-wrapper,
								.window-editor-wrapper, 
								.dual-view-wrapper, 
								.editor-area,
								.preview-area-wrapper,
								.preview-area,
								.main-editor-wrapper{
										height: 100%;

								}

								.content-wrapper {
										height:100%;
								}
								.note-active-ribbon {
										height: 2px;
										width: 100%;
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

								.note-wrapper {
										.editor-toolbar-dropdown {
												position: absolute;
												top: 10px;
												right: 0px;
										}
								}





								.window-buttons-bar {
										position: absolute;
										z-index:2;
										right: 30px;
										top: 10px;
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


								
								// content css modification
								.dual-view-wrapper {
										.file-path-wrapper {
												display:none;
										}
										 .editor-area {
												position:initial;
												.infos-editor-wrapper {
														z-index: 1;
														position:absolute;
														top: 0px;
														left: 0px;
														width: 100%;
														border-bottom: 1px solid rgba(0 0 0 / 5%);
														//box-shadow: 0px 0px 5px rgba(0,0,0,.2);
														height: 32px;
														padding: 0px;
												}
												.main-editor-wrapper,
												.infos-editor-wrapper {
														padding-left: 10px;
														padding-rigth: 10px;
														width: calc(100% - 20px);
														.title-input-wrapper {
																padding-left: 10px;
																.press-to-save {
																		top: -6px;
																		left: -6px;
																		right: initial;
																		opacity: 0.5;
																}
																.big-title {
																		width: calc(100% - 65px);
																		font-family: ${cssVars.font.editor};
																		color: grey;
																		font-size: 15px;
																}
														}
												}
												.main-editor-wrapper {
														margin-top: 43px;
												}
										}

										 // 
										 // ALL
										 // 
										 &.device-desktop {
														.preview-area-wrapper {
																margin-top: 33px;
																padding: 5px 5px 5px 5px;
																background: #F7F7F7;
														}
														.preview-area {
																padding: 10px;
														}
										 }

										 // 
										 // FULL PREVIEW
										 // 
										 &.device-desktop.view-preview {
														.editor-area {
																width: 100%
														}
														.preview-area-wrapper {
														}
										 }

										 // 
										 // FULL EDITOR
										 // 
										 &.device-desktop.view-editor {
												.preview-area-wrapper {
												}
										 }

										 .scrolling-bar-wrapper {
														top: 33px;
										 }
								}
						}
				}
		}
}
`;
