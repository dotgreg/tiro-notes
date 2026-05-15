import { cloneDeep } from 'lodash-es';
import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { generateUUID } from '../../../shared/helpers/id.helper';
import { iNotification, iNotificationType } from '../../../shared/types.shared';
import { getApi } from '../hooks/api/api.hook';
import { devCliAddFn } from '../managers/devCli.manager';
import { cssVars } from '../managers/style/vars.style.manager';
import { Icon2 } from './Icon.component';
import { userSettingsSync } from '../hooks/useUserSettings.hook';
import { workMode_isStringOk } from '../managers/workMode.manager';
import { notifications_onclick_functions_dic } from '../hooks/api/notification.api.hook';

const h = `[NOTIFICATIONS]`
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
	

	const isEnabled = (cb:(res:boolean) => void) => {
		getApi(api => {
			cb(!api.userSettings.get("view_disable_notification_popups"))
		})
	}
	useEffect(() => {
		getApi(api => {
			api.socket.get(s => {
				s.on('getNotification', data => {
					// if notifications are disabled in settings, do not display it
					isEnabled(res => {
						if (!res === true) return console.log("[NOTIFS] notifications disabled, not displaying it")
						
						const workModePass = workMode_isStringOk(data.notification.content)
						if (!workModePass) return console.log("[NOTIFS] workMode not ok, not displaying it")

						if (!data.notification.id) data.notification.id = generateUUID()
						addNotif(data.notification)
						afterTimeoutClose(data.notification)

					})
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

	const triggerNotifOnClick = (idFn: string) => {
		console.log(h, "triggerNotifOnClick => ", idFn)
		let fn = notifications_onclick_functions_dic[idFn]
		if (fn) fn()
		else console.log(h, "no fn found for idFn", idFn)
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

	const onClickClose = (n: iNotification) => {
		// console.log("onClickClose", n)
		// if (n.options?.onClick) n.options.onClick()
		if (n.options?.onClickId) triggerNotifOnClick(n.options?.onClickId)
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
						<div key={n.id} className={`notif-wrapper notif-type-${getNotifType(n)}`} onClick={e => { onClickClose(n); closeNotif(n.id) }}>
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
		z-index: 20000;

		.notifications-list {
				// .notif-wrapper:hover {
				// 	opacity: 0;
				// 	pointer-events: none;
				// }
				.notif-wrapper {
						// background: ${cssVars.colors.main}; 
						background: white;
						position: relative;
						margin: 5px;
						cursor: pointer;


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
								max-width: 200px;
								max-height: 180px;
								overflow-y: auto;
								word-break: break-word;
						}
				}
		}
}
`
