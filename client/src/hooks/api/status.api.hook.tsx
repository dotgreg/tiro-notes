import { useState } from "react"

export interface iStatusApi {
	isConnected: boolean,
	searching: {
		get: boolean
		set: (isSearching: boolean) => void
	}
}

export const useStatusApi = (p: {
	isConnected: boolean
}): iStatusApi => {


	const [isSearching, setIsSearching] = useState(false)

	return {
		isConnected: p.isConnected,
		searching: { get: isSearching, set: setIsSearching }
	}
}
