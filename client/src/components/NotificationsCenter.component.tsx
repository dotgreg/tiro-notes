import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { getApi } from '../hooks/api/api.hook';
import { devCliAddFn } from '../managers/devCli.manager';
import { clientSocket2 } from '../managers/sockets/socket.manager';

devCliAddFn("notification", "emit", () => {
	getApi(api => {
		api.ui.notification.emit({
			content: "hello world notif"
		})
	})
})

export const NotificationsCenter = (p: {
}) => {

	useEffect(() => {
		clientSocket2.on('getNotification', data => {
			console.log("NOTIIIF", data.notification)
		})
	}, [])


	return (
		<div className="notifications-center-wrapper">
			
		</div >
	)
}

export const NotificationsCenterCss = () => `

	.notifications-center-wrapper {
	}
`
