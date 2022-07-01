import { useRef, useState } from 'react';

export const useSyncScroll = (maxY: number) => {
	// // scrolling logic
	// const updateSyncScroll = (deltaY: number) => {
	// 	let direction = deltaY > 0 ? 1 : -1
	// 	let delta = direction * Math.min(Math.abs(deltaY), 40)
	// 	let newY = posY + delta
	// 	if (newY > -200 && newY < maxY) setPosY(newY)
	// }
	// const syncScrollY = posY


	const [cnt, setCnt] = useState(0)
	const syncYRef = useRef(0)

	const getSyncY = (): number => { return syncYRef.current }
	const setSyncY = (nY: number) => {
		syncYRef.current = nY
		setCnt(cnt + 1)
	}
	const updateSyncYWithDelta = (deltaY: number) => {
		let direction = deltaY > 0 ? 1 : -1
		let delta = direction * Math.min(Math.abs(deltaY), 40)
		let newY = getSyncY() + delta
		if (newY > -200 && newY < maxY) setSyncY(newY)
	}

	const yCnt = cnt

	return { getSyncY, setSyncY, yCnt, updateSyncYWithDelta }
}
