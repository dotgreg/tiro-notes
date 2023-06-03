import { useEffect } from "react"
import { clientSocket2 } from "../managers/sockets/socket.manager"
import { iApiEventBus } from "./api/api.hook"


// 1st trial but to finish
export const useApiCall = (p: {
    ask: string
    get: string
    eventBus: iApiEventBus
}) => {

    useEffect(() => {
		clientSocket2.on('getCommandExec', data => {
			p.eventBus.notify(data.idReq, data.resultCommand)
		})
	}, [])


    return 
}