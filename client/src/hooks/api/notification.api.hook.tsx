import React, { useEffect } from "react"
import { iNotification, iPlugin } from "../../../../shared/types.shared"
import { clientSocket2 } from "../../managers/sockets/socket.manager"
import { getLoginToken } from "../app/loginToken.hook"
import { getApi } from "./api.hook"

const h = `[NOTIFICATIONS]`

export interface iNotificationApi {
	emit: (notification: iNotification, cb?:Function) => void
}

export const useNotificationApi = (p: {
}) => {

	// get files list
	const emitNotification: iNotificationApi['emit'] = (notification, cb) => {
		const showNotif = () => {
			console.log(h, `emitNotification`, notification)
			if (cb) cb()
			clientSocket2.emit('emitNotification', {
				notification,
				token: getLoginToken(),
			})
		}

		if (notification.options?.showOnceEvery && notification.id) {
			getApi(api => {
				let cid = `notif-showevery-${notification.id}`
				api.cache.get(cid, cacheInfo => {
					if (cacheInfo && cacheInfo.alreadyShown === true) return console.log(h, `showOnceEvery => already shown notif, dont reshow it`, notification)
					showNotif()
					api.cache.set(cid, {alreadyShown: true},  notification.options?.showOnceEvery)
				})
			})
		} else {
			showNotif()
		}

		// tiroApi.cache.get(notifId, cacheInfo => {
        // if (cacheInfo && cacheInfo.alreadyShown === true) return console.log(h, "sendNotif already shown, dont reshow it", event)
		
		 // tiroApi.cache.set(notifId, {alreadyShown: true},  4*60) // 4h cache, so should show reminder 1-2 times then
    // })
	}


	//
	// EXPORTS
	//
	const api: iNotificationApi = {
		emit: emitNotification
	}

	return api
}
