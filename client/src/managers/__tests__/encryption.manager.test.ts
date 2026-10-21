import { encryptText, decryptText } from '../encryption.manager'

const P = '__test_key_cache_password__'

describe('encryption.manager rsa key cache', () => {
	test('cipher from one call decrypts in another call (key is stable per password)', () => {
		const cipher = encryptText('hello tiro', P).cipher
		expect(typeof cipher).toBe('string')
		expect(decryptText(cipher as string, P).plaintext).toBe('hello tiro')
	})

	test('second call reuses the cached key instead of regenerating it', () => {
		encryptText('warm the cache', P)
		const t0 = performance.now()
		encryptText('again', P)
		const cost = performance.now() - t0
		// cryptico.generateRSAKey(1024) is a ~750ms blocking prime search; a cached call is ~1ms
		expect(cost).toBeLessThan(100)
	})
})
