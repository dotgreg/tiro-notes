module.exports = {
		preset: 'ts-jest',
		moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
		transform: {
				'^.+\\.(ts|tsx)?$': 'ts-jest',
				"^.+\\.(js|jsx)$": "babel-jest",
		},
		setupFiles: ['raf/polyfill', './scripts/testingEnvSetup.script.js'],
		testRegex: '/__tests__/.*\\.(ts|tsx|js)$',
		moduleNameMapper: {
				// REQUIRED + file.js to mock files
				'\\.(png|jpg|webp|ttf|woff|woff2|svg|mp4|css|less|jpeg)$': '<rootDir>/__mocks__/file.js',
				// lodash-es is ESM, jest runs CJS: map to the same API in CJS
				'^lodash-es$': 'lodash',
				'^lodash-es/(.*)$': 'lodash/$1'
		},
		setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
		snapshotSerializers: [],
		// REQUIRED TO PROCESS STUFFS W window.
		testEnvironment: 'jest-environment-jsdom',
		// hermetic tests: jsdom must not fetch <script src> (child-logic tests drive script.onload/onerror manually)
		testEnvironmentOptions: {
				resources: undefined
		}
};


/*

	client/__mock__/ contains a file.js + react-monaco-editor.js to mock that module

*/
