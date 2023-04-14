import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { clientSocket2 } from '../managers/sockets/socket.manager';

export const NotificationsCenter = (p: {
}) => {

	useEffect(() => {
		clientSocket2.on('getNotification', data => {
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
