import { useState } from "react"

export interface iStatusApi {
	isConnected: boolean,
	searching: {
		get: boolean
		set: (isSearching: boolean) => void
	}
	refresh: {
		get: number
		set: Function
		increment: Function
	}
}

export const useStatusApi = (p: {
	isConnected: boolean
	refresh: {
		get: number,
		set: Function,
	}
}): iStatusApi => {


	const [isSearching, setIsSearching] = useState(false)

	return {
		isConnected: p.isConnected,
		searching: { get: isSearching, set: setIsSearching },
		refresh: {
			...p.refresh,
			increment: () => { p.refresh.set(p.refresh.get + 1) }
		}
	}
}
