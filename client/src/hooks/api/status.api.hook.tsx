import { useState } from "react"

export interface iStatusApi {
	isConnected: boolean,
	ipServer: {
		get: string[]
		set: (nIps: string[]) => void
	}
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
	const [ipServer, setIpServer] = useState<string[]>([])

	return {
		isConnected: p.isConnected,
		searching: { get: isSearching, set: setIsSearching },
		ipServer: { get: ipServer, set: setIpServer },
		refresh: {
			...p.refresh,
			increment: () => { p.refresh.set(p.refresh.get + 1) }
		}
	}
}
