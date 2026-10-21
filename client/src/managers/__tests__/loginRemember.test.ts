import { clearRememberedCreds, getRememberedCreds, REMEMBER_COOKIE, setRememberedCreds } from '../loginRemember.manager'

describe('remember-me login cookie', () => {
	test('user/password survive an encrypt/decrypt roundtrip, never in clear', async () => {
		const t0 = Date.now()
		await setRememberedCreds('alice', 's3cr3t!p@ss')
		expect(document.cookie).toContain(`${REMEMBER_COOKIE}=`)
		expect(document.cookie).not.toContain('alice')
		expect(document.cookie).not.toContain('s3cr3t')
		expect(await getRememberedCreds()).toEqual({ user: 'alice', password: 's3cr3t!p@ss' })
		// regression: cryptico RSA keygen cost ~750ms desktop, ~16s mobile no-JIT. WebCrypto is single digit ms.
		expect(Date.now() - t0).toBeLessThan(500)
	})
	test('cleared cookie means no remembered creds', async () => {
		clearRememberedCreds()
		expect(await getRememberedCreds()).toBeUndefined()
	})
	test('legacy cryptico cookie is unreadable and gets cleared', async () => {
		document.cookie = `${REMEMBER_COOKIE}=Oq3kLegacyCrypticoCipherBlob==; path=/`
		expect(await getRememberedCreds()).toBeUndefined()
		expect(document.cookie).not.toContain('Oq3kLegacy')
	})
})
