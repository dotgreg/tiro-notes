module.exports = {
		preset: 'ts-jest',
		moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
		transform: {
				'^.+\\.(ts|tsx)?$': 'ts-jest',
				"^.+\\.(js|jsx)$": "babel-jest",
		},
		setupFiles: ['raf/polyfill'],
		testRegex: '/__tests__/.*\\.(ts|tsx|js)$',
		moduleNameMapper: {
				// REQUIRED + file.js to mock files
				'\\.(png|jpg|webp|ttf|woff|woff2|svg|mp4|css|less|jpeg)$': '<rootDir>/__mocks__/file.js'
		},
		setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
		snapshotSerializers: [],
		// REQUIRED TO PROCESS STUFFS W window.
		testEnvironment: 'jest-environment-jsdom',
		// NEEDED FOR IFRAME LOADING => but still doesnt work
		testEnvironmentOptions: {
				resources: "usable"
		}
};


/*

	client/__mock__/ contains a file.js + react-monaco-editor.js to mock that module

*/
