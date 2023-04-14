import { useEffect } from "react"
import { iNotification, iPlugin } from "../../../../shared/types.shared"
import { clientSocket2 } from "../../managers/sockets/socket.manager"
import { getLoginToken } from "../app/loginToken.hook"

const h = `[NOTIFICATIONS]`

export interface iNotificationApi {
	emit: (notification: iNotification) => void
}

export const useNotificationApi = (p: {
}) => {

	// get files list
	const emitNotification: iNotificationApi['emit'] = (notification) => {
		clientSocket2.emit('emitNotification', {
			notification,
			token: getLoginToken(),
		})
	}

	//
	// EXPORTS
	//
	const api: iNotificationApi = {
		emit: emitNotification
	}

	return api
}
