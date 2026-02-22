import { each } from "lodash-es"
import { useState } from "react"
import { iApiEventBus } from "./api.hook";
import { extractDocumentation } from "../../managers/apiDocumentation.manager";

export interface iStatusApi {
	documentation?: () => any,
	isConnected: boolean,
	ipsServer: {
		get: string[]
		set: (nIps: string[]) => void
		getLocal: () => string
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
	isConnected: boolean,
	refresh: {
		get: number,
		set: Function,
	}
}): iStatusApi => {

	const [isSearching, setIsSearching] = useState(false)
	const [ipsServer, setIpsServer] = useState<string[]>([])
	const getLocalIpServer = () => {
		let res = ipsServer[0]
		each(ipsServer, ip => {
			if (ip.startsWith('192.168')) res = ip
		})
		return res
	}

	let api: iStatusApi = {
		isConnected: p.isConnected,
		searching: { get: isSearching, set: setIsSearching },
		ipsServer: { get: ipsServer, set: setIpsServer, getLocal: getLocalIpServer },
		refresh: {
			...p.refresh,
			increment: () => { p.refresh.set(p.refresh.get + 1) }
		}
	}
	api.documentation = () => extractDocumentation( api, "api.status", "client/src/hooks/api/status.api.hook.tsx" )

	return api
}
