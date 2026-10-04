import { getCookie, setCookie } from './cookie.manager'
import { decryptText, encryptText } from './encryption.manager'

//
// "REMEMBER THIS DEVICE" LOGIN: user/password encrypted in a 30 days cookie
//
export const REMEMBER_COOKIE = 'tiro-login-remember'
export const REMEMBER_COOKIE_HOURS = 24 * 30
export const LOGIN_ENC_KEY = "__HARDCODED_LOGIN_LS_PASSWORD_0129dsfaf1029__"

export const setRememberedCreds = (user: string, password: string) => {
	const res = encryptText(JSON.stringify({ u: user, p: password }), LOGIN_ENC_KEY)
	if (res.cipher) setCookie(REMEMBER_COOKIE, encodeURIComponent(res.cipher), REMEMBER_COOKIE_HOURS)
}
export const clearRememberedCreds = () => setCookie(REMEMBER_COOKIE, '', 0)
export const getRememberedCreds = (): { user: string, password: string } | undefined => {
	const raw = getCookie(REMEMBER_COOKIE)
	if (!raw) return
	const res = decryptText(decodeURIComponent(raw), LOGIN_ENC_KEY)
	if (res.status !== 'success' || !res.plaintext) { clearRememberedCreds(); return }
	try {
		const creds = JSON.parse(res.plaintext)
		if (creds.u && creds.p) return { user: creds.u, password: creds.p }
	} catch (e) { }
	// cookie is corrupted or too old to decrypt
	clearRememberedCreds()
}
