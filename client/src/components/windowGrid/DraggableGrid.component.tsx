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


//const rh = 10
// donc en gros rowHeight doit etre egal a window.height/(2*10)
// 600 wheight, donc on veut /2 grid = 300 et 10 pour plus de flex
const m = 5
const d = {
	m: 5,
	rows: 2,
	cols: 3,
	decalBottom: 50
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
	useEffect(() => {
		p.onGridUpdate({ layout: intLayout, content: intContent })
	}, [intContent])

	// on layout modification
	useEffect(() => {
		updateCanAdd();
		updateCanRemove();
		p.onGridUpdate({ layout: intLayout, content: intContent })
	}, [intLayout])

	// 
	// ADDING LOGIC
	// 
	const addNewWindow = () => {
		const nWindow = addNewWindowConfig(1, 1)
		const nLayout = cloneDeep(intLayout)
		nLayout.push(nWindow.layout)
		setIntLayout(nLayout)

		const nContent = cloneDeep(intContent)
		nContent.push(nWindow.content)
		setIntContent(nContent)
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

		const nContent = filter(cloneDeep(intContent), c => c.i !== id)
		setIntContent(nContent)
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
			c.active = (c.i === windowId) ? true : false
		})
		setIntContent(nContent)
	}

	// 
	// LIMIT RESIZING LOGIC
	// 
	const updateLayoutLogic = (newLayout) => {
		const nlayout = cloneDeep(newLayout);
		if (isItAllGoody(nlayout)) {
			setIntLayout(nlayout)
			updateLastGood(nlayout)
		} else {
			if (!lastGoodLayout.current) return
			const nLayout = cloneDeep(lastGoodLayout.current)
			each(nLayout, window => {
				window.refresh = increment(window.refresh)
			})
			setIntLayout(nLayout)
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

	return (
		<div className={cssApp}>
			<div className="draggable-grid-wrapper" ref={divWrapper}>
				<GridLayout
					className="draggable-grid"
					autoSize={false}
					layout={cloneDeep(intLayout)}
					onLayoutChange={updateLayoutLogic}
					cols={d.cols}
					compactType="horizontal"
					useCSSTransforms={true}
					rowHeight={rh()}
					width={s.width}
					margin={[m, m]}
				>
					{
						intLayout.map((window, i) =>
							<div
								key={window.i}
								className={`${intContent[i].active ? 'active' : ''} window-wrapper`}
							>
								{canAdd && <button onClick={addNewWindow}> + </button>}
								{canRemove && <button onClick={() => { removeWindow(window.i) }}> x </button>}
								<div
									className="window-name"
									onClick={() => { makeWindowActive(window.i) }}
								>
									W - {intContent[i].file?.name}
								</div>

								<div className="note-wrapper">
									<WindowEditor file={intContent[i].file} />
								</div>

							</div>
						)
					}

				</GridLayout>
			</div>
		</div>
	)
}

const cssApp = css`

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
						//background: grey;
						width: 100%;
						height: 100%;
						.window-wrapper {
								//background: orange;
								overflow-y: hidden;
								overflow-x: hidden;
								height:100%;
								.content-wrapper {
										height:100%;
								}
								&.active {
										//background:red;
										font-weight: bold
								}

						}
				}
		}
`
