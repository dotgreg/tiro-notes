module.exports = {
		preset: 'ts-jest',
		roots: ['<rootDir>/src'],
		moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
		transform: {
				'\\.(ts|tsx)$': 'ts-jest',
		},
		setupFiles: ['raf/polyfill'],
		testRegex: '/__tests__/.*\\.(ts|tsx|js)$',
		moduleNameMapper: {
				'^.+\\.(s?css|less|jpg|png|svg)$': 'identity-obj-proxy',
		},
		setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
		snapshotSerializers: [],
		// testEnvironment: "jsdom",
		testEnvironment: 'jest-environment-jsdom',
};
