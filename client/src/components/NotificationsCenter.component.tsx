import { cloneDeep } from 'lodash';
import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { generateUUID } from '../../../shared/helpers/id.helper';
import { iNotification, iNotificationType } from '../../../shared/types.shared';
import { getApi } from '../hooks/api/api.hook';
import { devCliAddFn } from '../managers/devCli.manager';
import { cssVars } from '../managers/style/vars.style.manager';
import { Icon2 } from './Icon.component';

devCliAddFn("notification", "emit", (str?: string, o?: any) => {
	// if (!o.hideAfter) o.hideAfter
	let s = str ? str : ""
	getApi(api => {
		console.log(str, o);
		api.ui.notification.emit({
			content: new Date().toJSON() + " \n\n <br/> test notif => \n" + s,
			options: {
				...o
			}
		})
	})
})

export const NotificationsCenter = (p: {
}) => {
	const [notifs, setNotifs] = useState<iNotification[]>([])
	const notifsRef = useRef<iNotification[]>([])

	useEffect(() => {
		getApi(api => {
			api.socket.get(s => {
				s.on('getNotification', data => {
					if (!data.notification.id) data.notification.id = generateUUID()
					addNotif(data.notification)
					afterTimeoutClose(data.notification)
				})
			})
		})
	}, [])


	const timeoutsRef = useRef<{[id:string]: any}>({})
	const afterTimeoutClose = (n: iNotification) => {
		let timeout = (n.options?.hideAfter || 10) * 1000
		if (timeout < 0) return // if -1, no closing
		
		if (!n.id) return
		timeoutsRef.current[n.id] = setTimeout(() => {
			closeNotif(n.id)
		}, timeout)
	}

	const addNotif = (n: iNotification) => {
		// remove previous notif with current id
		notifsRef.current = notifsRef.current.filter(i => i.id !== n.id)
		// cancel previous timeouts
		if (n.id && timeoutsRef.current[n.id]) clearTimeout(timeoutsRef.current[n.id])
		// add it first pos
		notifsRef.current.unshift(n)
		
		setNotifs([...notifsRef.current])
	}

	const closeNotif = (id?: string) => {
		if (!id) return
		notifsRef.current = notifsRef.current.filter(n => n.id !== id)
		setNotifs([...notifsRef.current])
	}

	const getNotifType = (n: iNotification): iNotificationType => {
		let type: iNotificationType = "normal"
		if (n.options?.type) type = n.options?.type
		return type
	}

	return (
		<div className="notifications-center-wrapper">
			<div className="notifications-list">
				{
					notifs.map(n =>
						<div key={n.id} className={`notif-wrapper notif-type-${getNotifType(n)}`}>
							<div className="notif-close" onClick={e => { closeNotif(n.id) }}>
								<Icon2 name="close" />
							</div>
							<div className="notif-content"
								dangerouslySetInnerHTML={{
									__html: n.content
								}}
							>
							</div>
						</div>
					)
				}
			</div >
		</div >
	)
}

export const NotificationsCenterCss = () => `
.notifications-center-wrapper {
		position: fixed;
		top: 0px;
		right: 0px;
		z-index: 2000;

		.notifications-list {
				.notif-wrapper {
						// background: ${cssVars.colors.main}; 
						background: white;
						position: relative;
						margin: 5px;


						padding: 5px;
						border-radius: 5px;
						box-shadow: 0px 0px 5px #0006;
						.notif-close {
								cursor: pointer;
								position: absolute;
								top: 3px;
								right: 5px;
								padding: 5px;
								background: white;
						}
						.notif-content {
								padding: 5px 29px 5px 5px;
								max-width: 190px;
								max-height: 180px;
								overflow-y: auto;
								word-break: break-word;
						}
				}
		}
}
`
