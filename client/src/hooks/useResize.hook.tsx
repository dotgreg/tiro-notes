import { debounce } from "lodash";
import { useEffect, useRef, useState } from "react";

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

		window.addEventListener('resize', () => {
			debouncedResponsiveRender()
		})

		return () => {
			window.removeEventListener('resize', () => {
				debouncedResponsiveRender()
			})
		}
	}, [])
	return { resizeState, resizeCount }
}
