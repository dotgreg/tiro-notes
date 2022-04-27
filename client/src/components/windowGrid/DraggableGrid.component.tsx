import React, { ReactElement, useState, useEffect, useRef } from 'react';
import { css, cx } from '@emotion/css'
import { cloneDeep, each, filter, isNumber } from 'lodash'
import GridLayout from "react-grid-layout";
import '../../../node_modules/react-grid-layout/css/styles.css'
import '../../../node_modules/react-resizable/css/styles.css'
import { useResize } from '../../hooks/useResize.hook';
import { iWindow } from '../../../../shared/types.shared';
import { addNewWindowConfig } from '../../hooks/app/tabs.hook';


//const rh = 10
// donc en gros rowHeight doit etre egal a window.height/(2*10)
// 600 wheight, donc on veut /2 grid = 300 et 10 pour plus de flex
const m = 5
const d = {
	m: 5,
	rows: 2,
	cols: 3,
}

export const DraggableGrid = (p: { layout: iWindow[] }) => {

	const [intLayout, setIntLayout] = useState<iWindow[]>([])
	const lastGoodLayout = useRef<iWindow[]>();

	// on receiving different layout from parent
	useEffect(() => {
		setIntLayout(p.layout)
	}, [p.layout])

	// on resize etc.
	useEffect(() => {
		console.log(997, 'update intlayout', intLayout);
		updateCanAdd();
		updateCanRemove();
	}, [intLayout])

	const resetLayout = () => {
		console.log(993, lastGoodLayout.current, intLayout);
		if (!lastGoodLayout.current) return
		// not working..
		const nLayout = cloneDeep(lastGoodLayout.current)
		each(nLayout, window => {
			window.forceRender = isNumber(window.forceRender) ? window.forceRender++ : 0
		})
		setIntLayout(nLayout)

		// working
		/* const nLayout: iWindow[] = [
			{ w: 2, h: 2, x: 1, y: 0, i: "9c90409e-8ba6-41ae-a1a7-c23cc4970ec2", active: false, minH: 1, maxH: 2 },
			{ w: 1, h: 1, x: 0, y: 0, i: "1203932109", active: false, minH: 1, maxH: 2 },
		]
		setIntLayout(nLayout) */
	}

	// 
	// ADDING LOGIC
	// 
	const addNewWindow = () => {
		const nLayout = cloneDeep(intLayout)
		nLayout.push(addNewWindowConfig(1, 1))
		setIntLayout(nLayout)
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
		//console.log(996, totalAllowedSize, totalSize);
		if (totalSize === totalAllowedSize) setCanAdd(false)
		else setCanAdd(true)
	}


	// 
	// LIMIT RESIZING LOGIC
	// 
	const updateLayoutLogic = (newLayout) => {
		const nlayout = cloneDeep(newLayout);
		if (isItAllGoody(nlayout)) {
			setIntLayout(nlayout)
			updateLastGood(nlayout)
			console.log("GOOOOD", lastGoodLayout);

		} else {
			console.log("NOT GOOD");
			if (!lastGoodLayout.current) return
		const nLayout = cloneDeep(lastGoodLayout.current)
		each(nLayout, window => {
			window.forceRender = isNumber(window.forceRender) ? window.forceRender++ : 0
		})
		setIntLayout(nLayout)
		}
	}

	const updateLastGood = (nlayout: iWindow[]) => {
		lastGoodLayout.current = cloneDeep(nlayout)
		console.log('UPDATE LAST GOOD', lastGoodLayout.current);

		/* if (!lastGoodLayout.current) lastGoodLayout.current = []
		for (let i = 0; i < nlayout.length; i++) {
			const el = nlayout[i];
			const lel = lastGoodLayout.current[i]
			if (!el || !lel) return
			lel.x = el.x
			lel.y = el.y
			lel.h = el.h
			lel.w = el.w
		} */
	}

	// check if resizing new layout is good
	const isItAllGoody = (nlayout: iWindow[]): boolean => {
		let allGood = true
		for (let i = 0; i < nlayout.length; i++) {
			const el = nlayout[i];
			console.log(995, el.y, el.h);
			// should not be positionned below 1
			if (el.y > 1) allGood = false
			// if h is 2, y should be 0
			if (el.h > 1 && el.y > 0) allGood = false
		}
		return allGood;
	}

	// init widht/height
	const divWrapper = useRef<HTMLDivElement>(null)
	const s = {
		width: 300,
		height: 300
	}
	const rh = () => (s.height / d.rows) - (d.m * (d.rows + 1))
	if (divWrapper.current) {
		s.width = divWrapper.current.clientWidth
		s.height = divWrapper.current.clientHeight - 100
	}

	return (
		<div className={cssApp}>
			<div className="draggable-grid-wrapper" ref={divWrapper}>
				<button onClick={resetLayout}>reset</button>
				<GridLayout
					className="draggable-grid"
					autoSize={false}
					layout={cloneDeep(intLayout)}
					onLayoutChange={updateLayoutLogic}
					cols={d.cols}
					compactType="horizontal"
					rowHeight={rh()}
					width={s.width}
					margin={[m, m]}
				>
					{
						intLayout.map(window =>
							<div key={window.i}>
								{window.i} -
								{canAdd && <button onClick={addNewWindow}> + </button>}
								{canRemove && <button onClick={() => { removeWindow(window.i) }}> x </button>}
							</div>
						)
					}

				</GridLayout>
			</div>
		</div>
	)
}

const cssApp = css`
		height: 100%;
		.draggable-grid-wrapper {
				height: 100%;
				position: relative;
				.draggable-grid {
						height: 100%;
						background: grey;
						width: 100%;
						height: 100%;
						div {
								background: orange;
						}
				}
		}
`
