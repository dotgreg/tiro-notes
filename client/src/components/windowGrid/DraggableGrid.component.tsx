import React, { ReactElement, useState, useEffect, useRef } from 'react';
import { css, cx } from '@emotion/css'
import { cloneDeep, each, filter, isNumber, noConflict } from 'lodash'
import GridLayout from "react-grid-layout";
import '../../../node_modules/react-grid-layout/css/styles.css'
import '../../../node_modules/react-resizable/css/styles.css'
import { iGrid, iWindow, iWindowContent } from '../../../../shared/types.shared';
import { increment } from '../../../../shared/helpers/number.helper';
import { addNewWindowConfig } from '../../hooks/app/tabs.hook';
import { useResize } from '../../hooks/useResize.hook';
import { WindowEditor } from './WindowEditor.component';
import { cssVars } from '../../managers/style/vars.style.manager';
import { Icon } from '../Icon.component';
import { ButtonsToolbar } from '../ButtonsToolbar.component';


//const rh = 10
// donc en gros rowHeight doit etre egal a window.height/(2*10)
// 600 wheight, donc on veut /2 grid = 300 et 10 pour plus de flex
const m = 10
const d = {
	m: 5,
	rows: 2,
	cols: 3,
	decalBottom: 30
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
		console.log(111);
		p.onGridUpdate({ layout, content })
	}


	// 
	// ADDING LOGIC
	// 
	const addNewWindow = () => {

		const nWindow = addNewWindowConfig(1, 1)
		const nLayout = cloneDeep(intLayout)
		nLayout.push(nWindow.layout)
		if (isItAllGoody(nLayout)) {
			console.log(333, nLayout, nLayout.length, intLayout.length);
			setIntLayout(nLayout)

			// required to deplay the content update behind the layout because of react-grid...
			setTimeout(() => {
				const nContent = cloneDeep(intContent)
				nContent.push(nWindow.content)
				setIntContent(nContent)
				onGridUpdate(nLayout, nContent)
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
	const makeWindowActive = (windowId: string) => {
		const nContent = cloneDeep(intContent);
		each(nContent, c => {
			//console.log(windowId, c.i);
			c.active = (c.i === windowId) ? true : false
		})
		setIntContent(nContent)
		onGridUpdate(intLayout, nContent)
	}

	// 
	// LIMIT RESIZING LOGIC
	// 
	const updateLayoutLogic = (newLayout) => {
		//console.log(intLayout.length, intContent.length);
		//if (intLayout.length !== intContent.length) return
		const nlayout = cloneDeep(newLayout);
		if (isItAllGoody(nlayout)) {
			console.log('allgood');
			setIntLayout(nlayout)
			updateLastGood(nlayout)
			onGridUpdate(nlayout, intContent)
		} else {
			console.log('notgood');
			if (!lastGoodLayout.current) return
			const nLayout = cloneDeep(lastGoodLayout.current)
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
	// BUTTONS CONTROL
	//


	return (
		<div className='draggable-grid-wrapper'>
			<div className="debug">
				{intLayout.length} -
				{intContent.length}
			</div>
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
					margin={[m, m]}
				>
					{
						intLayout.map((window, i) =>
							<div
								key={window.i}
								className={`${intContent[i] && intContent[i].active ? 'active' : ''} window-wrapper`}
								onClick={() => { if (intContent[i]) makeWindowActive(intContent[i].i) }}
							>

								<div className="note-active-ribbon"></div>


								<div className={`window-buttons-bar ${canAdd ? 'can-add' : ''} ${canRemove ? 'can-remove' : ''}`}>
									<ButtonsToolbar
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
												action: addNewWindow
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
									<WindowEditor file={intContent[i] && intContent[i].file} />
								</div>

							</div>
						)
					}

				</GridLayout
				>
			</div >
		</div >
	)
}

export const draggableGridCss = `

.draggable-grid-wrapper {
		 	.debug {  
					display:none;
		position: absolute;
		top: 20px;
		}

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
								overflow: hidden;
								background: white;
								overflow-y: hidden;
								overflow-x: hidden;
								height:100%;
								.content-wrapper {
										height:100%;
								}
								.note-active-ribbon {
										height: 2px;
										width: 100%;
								}
								&.active {
										.note-active-ribbon {
												background:${cssVars.colors.main};
										}
								}

								.drag-handle {
										cursor: grab;
								}
								.delete-button svg {
										transform: rotate(45deg);
								}

								.can-add {
										.add-button {display: block;}
								}
								.can-remove {
										.detele-button {display: block;}
								}
								.detele-button {display: none;}
								.add-button {display: none;}


								
								// content css modification
								.dual-view-wrapper {
								}

						}
				}
		}
}
`
