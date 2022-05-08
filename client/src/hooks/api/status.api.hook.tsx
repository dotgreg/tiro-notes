import { useState } from "react"

export interface iStatusApi {
	isConnected: boolean,
	searching: {
		get: boolean
		set: (isSearching: boolean) => void
	}
	responsiveRefresh: number
}

export const useStatusApi = (p: {
	isConnected: boolean
	responsiveRefresh: number
}): iStatusApi => {


	const [isSearching, setIsSearching] = useState(false)

	return {
		isConnected: p.isConnected,
		searching: { get: isSearching, set: setIsSearching },
		responsiveRefresh: p.responsiveRefresh
	}
}
