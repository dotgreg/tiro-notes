/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // managers start long-lived timers/listeners on import (e.g. loginToken 96h refresh)
  forceExit: true,
};