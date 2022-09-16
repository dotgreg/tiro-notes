import { clamp } from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { useDynamicResponsive } from '../../hooks/app/dynamicResponsive.hook';
import { syncScroll2, syncScroll3 } from '../../hooks/syncScroll.hook';

export const ScrollingBar = (p: {
	windowId: string,
	// percent: number
	// onScroll: (percent: number) => void
}) => {

	const [barY, setBarY] = useState(0)

	let scrollBarEl = useRef<HTMLDivElement>(null)
	let scrollBarWrapperEl = useRef<HTMLDivElement>(null)

	const getStats = (): { maxY: number, y: number, percent: number } => {
		const res = { maxY: 0, y: 0, percent: 0 };
		const w = scrollBarWrapperEl.current ? scrollBarWrapperEl.current : null
		const s = scrollBarEl.current ? scrollBarEl.current : null
		if (!s || !w) return res;
		const size = s.getBoundingClientRect().height
		const decalTopW = w.getBoundingClientRect().y
		res.maxY = w.getBoundingClientRect().height - size
		res.y = s.getBoundingClientRect().y - decalTopW
		res.percent = Math.round((res.y / res.maxY) * 100)
		return res
	}



	//
	// we listen to data-scroll-y element changes done by syncscroll.hook
	// we bypass react for performances reasons here
	//
	useEffect(() => {
		const s = scrollBarWrapperEl.current ? scrollBarWrapperEl.current : null
		if (!s) return;
		let observer = new MutationObserver(function (mutationsList, observer) {
			for (var mutation of mutationsList) {
				if (mutation.attributeName === "data-scroll-refresh") {
					let scrollObj = syncScroll3.getScrollObj(p.windowId)
					setScrollBarHeight(scrollObj.dims.scroller.viewport)
				}

				if (mutation.attributeName === "data-scroll-y") {
					const newY = parseInt(s.dataset.scrollY || "")
					if (!isNaN(newY)) setBarY(newY)
				}

			}
		});
		observer.observe(s, { attributes: true });
		return () => { observer.disconnect() }
	}, [])

	const [scrollBarHeight, setScrollBarHeight] = useState(0)


	return <div
		className="scrolling-bar-wrapper"
		ref={scrollBarWrapperEl}
	>
		<Draggable
			onDrag={(a: any) => {
				// p.onScroll(getStats().percent)
			}}
			onStop={() => {
				setBarY(getStats().y)
			}}
			position={{ x: 0, y: barY }}
			axis="y"
			bounds="parent">
			<div
				ref={scrollBarEl}
				style={{ height: `${scrollBarHeight}px` }}
				className="scrolling-bar">
			</div>
		</Draggable>
	</div >
}

export const scrollingBarCss = () => `
.view-editor .scrolling-bar-wrapper {
}

.scrolling-bar-wrapper {
		position: absolute;
		top: 33px;
		height: calc(100% - 53px);
		background: rgb(226,226,226);
		width: 10px;
		right: 0px;
		position: absolute;

		.scrolling-bar {
				cursor: ns-resize;
				background: #cdcccc;
				height: 20px;

		}
}
`
















// export const ScrollingBar2 = (p: {
// 	percent: number
// 	onUpdated: (percent: number) => void
// }) => {

// 	const [barY, setBarY] = useState(0)

// 	const { frr, forceResponsiveRender } = useDynamicResponsive();
// 	let scrollBarEl = useRef<HTMLDivElement>(null)
// 	let scrollBarWrapperEl = useRef<HTMLDivElement>(null)

// 	useEffect(() => {
// 		replaceScrollBar(getStats().percent);
// 	}, [forceResponsiveRender]);

// 	useEffect(() => {
// 		replaceScrollBar(p.percent);
// 	}, [p.percent]);

// 	const getStats = (): { maxY: number, y: number, percent: number } => {
// 		const res = { maxY: 0, y: 0, percent: 0 };
// 		const w = scrollBarWrapperEl.current ? scrollBarWrapperEl.current : null
// 		const s = scrollBarEl.current ? scrollBarEl.current : null
// 		if (!s || !w) return res;
// 		const size = s.getBoundingClientRect().height
// 		const decalTopW = w.getBoundingClientRect().y
// 		res.maxY = w.getBoundingClientRect().height - size
// 		res.y = s.getBoundingClientRect().y - decalTopW
// 		res.percent = (res.y / res.maxY)
// 		return res
// 	}

// 	const replaceScrollBar = (percent: number) => {
// 		let p = clamp(percent, 0, 100);
// 		p = p / 100
// 		const st = getStats();
// 		let nY = p * st.maxY
// 		setBarY(nY);
// 	}

// 	return <div
// 		className="scrolling-bar-wrapper"
// 		ref={scrollBarWrapperEl}
// 	>
// 		<Draggable
// 			onDrag={(a: any) => {
// 				replaceScrollBar(getStats().percent)
// 				// p.onUpdated(getStats().percent)
// 			}}
// 			position={{ x: 0, y: barY }}
// 			axis="y"
// 			bounds="parent">
// 			<div
// 				ref={scrollBarEl}
// 				className="scrolling-bar">
// 			</div>
// 		</Draggable>
// 	</div>
// }
