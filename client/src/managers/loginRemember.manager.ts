import { getCookie, setCookie } from './cookie.manager'

//
// "REMEMBER THIS DEVICE" LOGIN: user/password encrypted in a 30 days cookie
//
// WebCrypto AES-GCM (native, ~5ms on mobile). The old cryptico RSA path cost ~16s
// per call in a no-JIT mobile WebView: generateRSAKey() is a Miller-Rabin prime search.
//
export const REMEMBER_COOKIE = 'tiro-login-remember'
export const REMEMBER_COOKIE_HOURS = 24 * 30
export const LOGIN_ENC_KEY = "__HARDCODED_LOGIN_LS_PASSWORD_0129dsfaf1029__"

const ITERATIONS = 10000
const enc = new TextEncoder()
const dec = new TextDecoder()

const getSubtle = (): SubtleCrypto | undefined => (typeof crypto !== 'undefined' && crypto.subtle) || undefined

let keyP: Promise<CryptoKey> | undefined
const getKey = (): Promise<CryptoKey> => keyP = keyP || (async () => {
	const base = await getSubtle()!.importKey('raw', enc.encode(LOGIN_ENC_KEY), 'PBKDF2', false, ['deriveKey'])
	return getSubtle()!.deriveKey(
		{ name: 'PBKDF2', salt: enc.encode(REMEMBER_COOKIE), iterations: ITERATIONS, hash: 'SHA-256' },
		base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
})()

const toB64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes))
const fromB64 = (s: string) => { const b = atob(s); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++)u[i] = b.charCodeAt(i); return u }

export const setRememberedCreds = async (user: string, password: string) => {
	const json = JSON.stringify({ u: user, p: password })
	const subtle = getSubtle()
	if (!subtle) {
		// ponytail: no WebCrypto outside a secure context (plain http LAN) => base64 only.
		// Same security class as the old RSA cookie: the key ships in the public bundle anyway.
		setCookie(REMEMBER_COOKIE, 'v1' + toB64(enc.encode(json)), REMEMBER_COOKIE_HOURS)
		return
	}
	const iv = crypto.getRandomValues(new Uint8Array(12))
	const cipher = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv }, await getKey(), enc.encode(json)))
	const bytes = new Uint8Array(iv.length + cipher.length)
	bytes.set(iv)
	bytes.set(cipher, iv.length)
	setCookie(REMEMBER_COOKIE, 'v2' + toB64(bytes), REMEMBER_COOKIE_HOURS)
}

export const clearRememberedCreds = () => setCookie(REMEMBER_COOKIE, '', 0)

export const getRememberedCreds = async (): Promise<{ user: string, password: string } | undefined> => {
	const raw = getCookie(REMEMBER_COOKIE)
	if (!raw) return

	let json = ''
	try {
		if (raw.startsWith('v2')) {
			const bytes = fromB64(raw.slice(2))
			const plain = await getSubtle()!.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12) }, await getKey(), bytes.slice(12))
			json = dec.decode(plain)
		}
		else if (raw.startsWith('v1')) json = dec.decode(fromB64(raw.slice(2)))
		else { clearRememberedCreds(); return }   // pre-WebCrypto (cryptico) cookie => unreadable
	} catch (e) { clearRememberedCreds(); return }

	try {
		const creds = JSON.parse(json)
		if (creds.u && creds.p) return { user: creds.u, password: creds.p }
	} catch (e) { }
	// cookie is corrupted or too old to decrypt
	clearRememberedCreds()
}
