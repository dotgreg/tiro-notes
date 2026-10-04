import { clearRememberedCreds, getRememberedCreds, REMEMBER_COOKIE, setRememberedCreds } from '../loginRemember.manager'

describe('remember-me login cookie', () => {
	test('user/password survive an encrypt/decrypt roundtrip, never in clear', () => {
		setRememberedCreds('alice', 's3cr3t!p@ss')
		expect(document.cookie).toContain(`${REMEMBER_COOKIE}=`)
		expect(document.cookie).not.toContain('alice')
		expect(document.cookie).not.toContain('s3cr3t')
		expect(getRememberedCreds()).toEqual({ user: 'alice', password: 's3cr3t!p@ss' })
	})
	test('cleared cookie means no remembered creds', () => {
		clearRememberedCreds()
		expect(getRememberedCreds()).toBeUndefined()
	})
})
