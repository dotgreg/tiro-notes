import { debounce, random } from "lodash-es";
import { useEffect, useRef, useState } from "react";
import { notifLog } from "../managers/devCli.manager";

export const useResize = () => {
	const [resizeState, setResizeState] = useState(false)
	const resizeCount = useRef(0)

	useEffect(() => {
		let debouncedResponsiveRender = debounce(() => {
			resizeCount.current = resizeCount.current + 1
			setResizeState(true)
			setTimeout(() => {
				setResizeState(false)
			}, 200)
		}, 200)

		// window.addEventListener('resize', () => {
		// 	notifLog(`resize1 ${random(0,1000)} ${window.innerWidth}:${window.innerHeight}`, "resize")
		// 	debouncedResponsiveRender()
		// })

		return () => {
			window.removeEventListener('resize', () => {
				debouncedResponsiveRender()
			})
		}
	}, [])
	return { resizeState, resizeCount }
}

export const useElResize = (elPath: string) => {
	const [resizeState, setResizeState] = useState(false)

	useEffect(() => {
		let debouncedResponsiveRender = debounce(() => {
			setResizeState(true)
			setTimeout(() => {
				setResizeState(false)
			}, 200)
		}, 200)

		let el = document.querySelector(elPath)
		if (!el) return
		let obs = new ResizeObserver(entries => {
			debouncedResponsiveRender()
		});
		obs.observe(el)

		return () => {
			obs.disconnect()
		}
	}, [])
	return { resizeState }
}
