process.env.TIRO_TESTING_ENV = 'true'
// mock the real server module: fs.manager imports it and its module-level code
// (server.listen, ssl config) crashes on the config.back circular import when a
// manager is imported directly from a test
jest.mock('../../server', () => ({}))
// require (not import) so TIRO_TESTING_ENV is set before the module graph loads
const { getOrCreateUserToken } = require("../loginToken.manager")
const { sharedConfig } = require("../../../../shared/shared.config")

test('tokenRefreshInHours stays inside node setInterval int32 range', () => {
    // past 2^31-1 ms node clamps setInterval to 1ms -> token regeneration floods the backend
    expect(1000 * 60 * 60 * sharedConfig.tokenRefreshInHours).toBeLessThanOrEqual(2147483647)
})

test('getOrCreateUserToken returns a non-empty string', () => {
    const token = getOrCreateUserToken("test")
    expect(typeof token).toBe("string")
    expect(token.length).toBeGreaterThan(0)
})

test('getOrCreateUserToken is stable for the same user', () => {
    const t1 = getOrCreateUserToken("test")
    const t2 = getOrCreateUserToken("test")
    expect(t2).toBe(t1)
})

test('getOrCreateUserToken differs between users', () => {
    const t1 = getOrCreateUserToken("test")
    const t2 = getOrCreateUserToken("otheruser")
    expect(t2).not.toBe(t1)
    expect(t2.length).toBeGreaterThan(0)
})
