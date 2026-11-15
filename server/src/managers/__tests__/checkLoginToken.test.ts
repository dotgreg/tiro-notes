process.env.TIRO_TESTING_ENV = 'true'
// same mock as loginToken.manager.test.ts: fs.manager imports ../../server and its module-level
// code (server.listen, ssl config) crashes when a manager is loaded directly from a test
jest.mock('../../server', () => ({}))
require("../loginToken.manager")
const { probeLoginToken, getOrCreateUserToken } = require("../loginToken.manager")
const { backConfig } = require("../../config.back")
// module scope: server/tsconfig.json type-checks src/**/*, so a script-scope test file would
// redeclare the names loginToken.manager.test.ts already declares at top level (TS2451 in webpack)
export { }

// The boot probe (routes.ts checkLoginToken) decides here. A dead token must answer WRONG_TOKEN
// (client then re-logins silently), a live one must answer SUCCESS with the same token, and
// dev.disableLogin (testing env) must answer SUCCESS even with an empty token.
test('probeLoginToken: live token -> SUCCESS with that token', () => {
    backConfig.dev.disableLogin = false
    const live = getOrCreateUserToken(backConfig.jsonConfig.user)
    expect(probeLoginToken(live)).toEqual({ code: 'SUCCESS', token: live })
})

test('probeLoginToken: empty token and token from a dead server -> WRONG_TOKEN', () => {
    backConfig.dev.disableLogin = false
    expect(probeLoginToken('').code).toBe('WRONG_TOKEN')
    expect(probeLoginToken('TOKEN_BEFORE_THE_LAST_SERVER_RESTART').code).toBe('WRONG_TOKEN')
})

test('probeLoginToken: dev.disableLogin -> SUCCESS even with an empty token', () => {
    backConfig.dev.disableLogin = true
    expect(probeLoginToken('')).toEqual({ code: 'SUCCESS', token: '' })
})
