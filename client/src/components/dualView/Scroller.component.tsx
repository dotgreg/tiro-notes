import { clamp } from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { useDynamicResponsive } from '../../hooks/app/dynamicResponsive.hook';

export const ScrollingBar = (p: {
	percent: number
	onUpdated: (percent: number) => void
}) => {

	const [barY, setBarY] = useState(0)

	const { frr, forceResponsiveRender } = useDynamicResponsive();
	let scrollBarEl = useRef<HTMLDivElement>(null)
	let scrollBarWrapperEl = useRef<HTMLDivElement>(null)

	useEffect(() => {
		replaceScrollBar(getStats().percent);
	}, [forceResponsiveRender]);

	useEffect(() => {
		replaceScrollBar(p.percent);
	}, [p.percent]);

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
		//console.log(`[SCROLLBAR] 666 getstats ${JSON.stringify(res)}`);
		return res
	}

	const replaceScrollBar = (percent: number) => {
		let p = clamp(percent, 0, 100);
		p = p / 100
		const st = getStats();
		let nY = p * st.maxY
		setBarY(nY);
	}

	return <div
		className="scrolling-bar-wrapper"
		ref={scrollBarWrapperEl}
	>
		<Draggable
			onDrag={(a: any) => {
				replaceScrollBar(getStats().percent)
				p.onUpdated(getStats().percent)
			}}
			position={{ x: 0, y: barY }}
			axis="y"
			bounds="parent">
			<div
				ref={scrollBarEl}
				className="scrolling-bar">
			</div>
		</Draggable>
	</div>
}

export const scrollingBarCss = () => `
.view-editor .scrolling-bar-wrapper {
}

.scrolling-bar-wrapper {
		position: absolute;
		top: 33px;
		height: calc(100% - 53px);
		opacity: 0.3;
		background: rgb(195,195,195);
		width: 10px;
		right: 0px;
		position: absolute;
		z-index: 101;

		.scrolling-bar {
				cursor: ns-resize;
				background: grey;
				height: 20px;

		}
}
`
