import { css } from '@emotion/react';
import { cloneDeep } from 'lodash-es';
import React, { useEffect, useRef, useState } from 'react';
import { sharedConfig } from '../../../../shared/shared.config';
import { Input } from '../../components/Input.component';
import { Popup } from '../../components/Popup.component';
import { getCookie, setCookie } from '../../managers/cookie.manager';
import { clearRememberedCreds, getRememberedCreds, LOGIN_ENC_KEY, REMEMBER_COOKIE, setRememberedCreds } from '../../managers/loginRemember.manager';
import { armLoginGate, initSocketConnexion, openLoginGate } from '../../managers/sockets/socket.manager';
import { strings } from '../../managers/strings.manager';
import { getUrlRawParams } from '../../managers/url.manager';
import { getApi } from '../api/api.hook';
import { useLocalStorage } from '../useLocalStorage.hook';


export const getLoginToken = (): string => {
	const cookie = getCookie('tiro-login-token')
	return cookie ? cookie : ''
}
export const getUrlTokenParam = (): string => {
	return `?token=${getLoginToken()}`
}
export const setLoginToken = (token: string) => {
	setCookie('tiro-login-token', token, sharedConfig.tokenRefreshInHours)
}
export const disconnectUser = () => {
	setLoginToken('')
	clearRememberedCreds()
}


export const useLoginToken = (p: {
	onLoginAsked: Function
	onLoginSuccess: Function
}) => {

	const [displayLoginPopup, setDisplayLoginPopup] = useState(false)

	const [user, setUser] = useState('')
	const [password, setPassword] = useState('')

	const [formMessage, setFormMessage] = useState<['error' | 'success', string]>()

	// last login sent to the backend, used to know if we must remember this device
	const lastSubmit = useRef({ user: '', password: '', remember: false, auto: false })
	// true between a WRONG_TOKEN and its answer: requests are queued by the socket login gate
	const reloginInFlight = useRef(false)
	// the login form is on screen: WRONG_TOKEN answers are expected, they must not re-arm the gate
	const popupShown = useRef(false)
	const [saveToLs, setSaveToLs] = useLocalStorage<boolean>("login-to-ls", !!getCookie(REMEMBER_COOKIE))
	// stored creds exist => remember was ON. The local checkbox flag can be stale (localStorage cleared
	// while the cookie survived): left false, the next SUCCESS would erase the stored creds.
	if (getCookie(REMEMBER_COOKIE) && !saveToLs) setSaveToLs(true)
	// the socket listeners are created once, at mount: reading `saveToLs` from that closure gives the
	// value of the first render (false) even after the line above flips it to true => the SUCCESS handler
	// then CLEARS the stored creds, which is exactly "login not remembered". Read the live value.
	const saveToLsRef = useRef(saveToLs)
	saveToLsRef.current = saveToLs

	// replay queued requests with the token that just got accepted
	const replayGated = (endpoint: any, payload: any) =>
		initSocketConnexion().then(conn => (conn.socketManager.emit as (e: string, p: any) => void)(endpoint, { ...payload, token: getLoginToken() }))

	// queue every request until the token is checked: an emit fired before login finishes gets
	// a WRONG_TOKEN (request dropped + login popup flashing at page load). The gate also opens by
	// itself after 8 s (see socket.manager) so a backend that never answers the probe cannot deadlock it.
	const armedGate = useRef(false)
	if (!armedGate.current) {
		armedGate.current = true
		armLoginGate(replayGated)
	}

	// SOCKET INTERACTIONS
	const listenerId = useRef<number>(0)

	const showLoginPopup = (data: any) => {
		setDisplayLoginPopup(true)
		setFormMessage(['error', strings.loginForm.wrongToken])
		// DEMO PREFILL MODE
		let infos = data.loginInfos
		if (infos?.demo_mode) {
			setUser("viewer")
			setPassword(infos.viewer_password)
		}
		// custom logic after LoginAsked
		p.onLoginAsked()
	}

	useEffect(() => {
		let cancelled = false
		initSocketConnexion().then(conn => {
			if (cancelled) {
				conn.socketManager.off(listenerId.current)
				return
			}
			listenerId.current = conn.socketManager.on('getLoginInfos', data => {
				switch (data.code) {
					case 'SUCCESS':
						popupShown.current = false
						// register token here
						if (!data.token) {
							setFormMessage(['error', 'server returned no token — reload the page'])
							break
						}
						setLoginToken(data.token)
						// only a real login (manual submit or silent re-login) decides what is stored.
						// The boot probe answers SUCCESS too: touching the creds there erased the stored
						// creds on every normal page load => "login is not remembered sometimes".
						if (lastSubmit.current.user) {
							if (lastSubmit.current.remember) setRememberedCreds(lastSubmit.current.user, lastSubmit.current.password)
							else clearRememberedCreds()
						}
						setDisplayLoginPopup(false)

						// token is alive: let the queued requests out with it
						reloginInFlight.current = false
						openLoginGate(replayGated)

						// custom logic after login success event
						p.onLoginSuccess()
						break;
					case 'WRONG_TOKEN':
						// token expired/invalid (backend restarted, cookie expired) => silent re-login with
						// the remembered creds. Requests sent meanwhile stay queued and are replayed on
						// SUCCESS; the popup only shows when there is nothing to re-login with.
						// The popup answers WRONG_TOKEN itself: once it is up, re-arming the gate and re-running
						// the credential decryption on every failed request only stalls the page (mobile freeze).
						if (reloginInFlight.current || popupShown.current) break
						reloginInFlight.current = true
						armLoginGate()
						getRememberedCreds().then(creds => {
							reloginInFlight.current = false
							if (creds) submitForm(creds, true)
							else {
								popupShown.current = true
								openLoginGate(() => { })   // nothing to re-login with: drop the queue, stop blocking
								showLoginPopup(data)
							}
						})
						break;
					case 'WRONG_USER_PASSWORD':
						// remembered creds are stale (password changed server side) => forget them
						if (lastSubmit.current.auto) clearRememberedCreds()
						reloginInFlight.current = false
						popupShown.current = true
						openLoginGate(() => { })   // user must type: nothing is worth waiting for
						setFormMessage(['error', strings.loginForm.wrongUserPassword])
						setDisplayLoginPopup(true)
						break;

					default:
						break;
				}
			})
			// ask the backend once per page load if the cookie token is still valid:
			// while it is unanswered, the socket login gate keeps every request queued
			conn.socketManager.emit('checkLoginToken', { token: getLoginToken() })
		})
		return () => {
			cancelled = true
			initSocketConnexion().then(conn => conn.socketManager.off(listenerId.current))
		}
	}, [])

	const [cachedUserPasswordLs, setCachedUserPasswordLs] = useLocalStorage<any>("user-password-cache-ls", {})

	useEffect(() => {
		if (displayLoginPopup) {
			// check if user and password inside url
			const urlParams = getUrlRawParams().dic
			const encryptedPassword = LOGIN_ENC_KEY
			if (
				urlParams['l1'] && urlParams['l2'] &&
				urlParams['l1'].value && urlParams['l2'].value
			) {
				getApi(api => {

					// if already in LS, do not decrypt, just take value from ls
					let id = urlParams['l1'].value + urlParams['l2'].value
					let usr
					let pass
					if (cachedUserPasswordLs[id]) {
						usr = cachedUserPasswordLs[id].usr
						pass = cachedUserPasswordLs[id].pass
					} else {
						usr = api.encryption.decryptUrlParam(urlParams['l1'].value, encryptedPassword).plaintext
						pass = api.encryption.decryptUrlParam(urlParams['l2'].value, encryptedPassword).plaintext
						if (usr && pass) {
							let nCache = cloneDeep(cachedUserPasswordLs)
							nCache[id] = { usr, pass }
							setCachedUserPasswordLs(nCache)
						}
					}

					if (usr && pass) {
						setUser(usr)
						setPassword(pass)
						setTimeout(() => {
							console.log("success login url, submitting it")
							initSocketConnexion().then(conn => {
								conn.socketManager.emit('sendLoginInfos', { user: usr, password: pass, token: getLoginToken() })
							})
						}, 1000)
					}
				})
			}
		}
	}, [displayLoginPopup])


	const submitForm = (creds?: { user: string, password: string }, auto = false) => {
		const userToSubmit = creds ? creds.user : user
		const passwordToSubmit = creds ? creds.password : password
		setFormMessage(undefined)
		if (!userToSubmit || !passwordToSubmit) {
			setFormMessage(['error', 'enter user and password'])
			return
		}
		lastSubmit.current = { user: userToSubmit, password: passwordToSubmit, remember: creds ? true : saveToLsRef.current, auto }
		initSocketConnexion().then(conn => {
			conn.socketManager.emit('sendLoginInfos', { user: userToSubmit, password: passwordToSubmit, token: getLoginToken() })
		})
	}
	const [inputFocus, setInputFocus] = useState(1)

	const LoginPopupComponent = (p: {

	}) => <>
			{displayLoginPopup &&
				<div className="login-popup-component">
					<Popup
						title={strings.setupForm.title}
						onClose={() => { }}
					>
						<div>
							<Input
								shouldFocus={inputFocus === 1}
								value={user}
								onEnterPressed={() => { setInputFocus(2) }}
								label={strings.setupForm.user}
								onChange={e => { setUser(e) }}
							/>
							<Input
								shouldFocus={inputFocus === 2}
								value={password}
								label={strings.setupForm.password}
								type={'password'}
								onEnterPressed={() => { submitForm() }}
								onChange={e => { setPassword(e) }}
							/>

							<Input
								value={saveToLs}
								label={strings.setupForm.saveToLs}
								type={'checkbox'}
								style={`.input-component { flex-direction: row-reverse; span {width: 90%; font-weight: 400; font-size: 10px; text-transform: lowercase;} .input-wrapper {width: 10%;}}`}
								onChange={() => { setSaveToLs(!saveToLs) }}
							/>

							<button value='submit' className="submit-button" onClick={e => { submitForm() }}>
								{strings.setupForm.submit}
							</button>

							{
								formMessage &&
								<div className={formMessage[0]}>
									{formMessage[1]}
								</div>
							}

						</div>
					</Popup>
				</div>}
		</>

	return {
		displayLoginPopup,
		LoginPopupComponent
	}
}

export const loginTokenCss = `
    .login-popup-component {
    }
`
