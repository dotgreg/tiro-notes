import { useState } from 'react';
import { monacoEditorInstance } from '../components/MonacoEditor.Component';

export const useSyncScroll = (maxY: number) => {
	// scrolling logic
	const [posY, setPosY] = useState(0)
	const updateSyncScroll = (deltaY: number) => {
		let direction = deltaY > 0 ? 1 : -1
		let delta = direction * Math.min(Math.abs(deltaY), 40)
		let newY = posY + delta
		if (newY > -200 && newY < maxY) setPosY(newY)
	}

	return { syncScrollY: posY, updateSyncScroll, setPosY }
}
