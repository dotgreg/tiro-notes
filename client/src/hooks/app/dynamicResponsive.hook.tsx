import { debounce } from "lodash-es";
import { useEffect, useRef, useState } from "react";

export const useDynamicResponsive = () => {
	const [forceResponsiveRender, setForceResponsiveRender] = useState(false)
	const [responsiveRefreshCounter, setResponsiveRefresh] = useState(0)
	const frr = useRef(0)

	useEffect(() => {
		let debouncedResponsiveRender = debounce(() => {
			frr.current = frr.current + 1
			setResponsiveRefresh(responsiveRefreshCounter + 1)
			setForceResponsiveRender(true)
			setTimeout(() => {
				setForceResponsiveRender(false)
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
	return { forceResponsiveRender, frr, responsiveRefreshCounter, setResponsiveRefresh }
}
