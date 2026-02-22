import React, { useEffect } from "react"
import { iApiDictionary } from "../../../../shared/apiDictionary.type"
import { clientSocket2, ClientSocketManager } from "../../managers/sockets/socket.manager"
import { extractDocumentation } from "../../managers/apiDocumentation.manager"

const h = `[SOCKET]`

export interface iSocketApi {
	// get: ClientSocketManager<iApiDictionary>
	get: (cb: (s: ClientSocketManager<iApiDictionary>) => void) => void
	documentation?: () => any
}

export const useSocketApi = () => {
	const get: iSocketApi['get'] = (cb) => {
		let int = setInterval(() => {
			if (clientSocket2) {
				cb(clientSocket2)
				clearInterval(int)
			}
		}, 10)
	}
	// const get: iSocketApi['get'] = clientSocket2

	//
	// EXPORTS
	//
	const api: iSocketApi = {
		get
	}
	api.documentation = () => extractDocumentation( api, "api.socket", "client/src/hooks/api/socket.api.hook.ts" )

	return api
}
