import React, { useEffect } from "react"
import { iApiDictionary } from "../../../../shared/apiDictionary.type"
import { clientSocket2, ClientSocketManager } from "../../managers/sockets/socket.manager"

const h = `[SOCKET]`

export interface iSocketApi {
	// get: ClientSocketManager<iApiDictionary>
	get: (cb: (s: ClientSocketManager<iApiDictionary>) => void) => void
}

export const useSocketApi = () => {
	const get: iSocketApi['get'] = (cb) => {
		console.log(333, cb)
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

	return api
}
