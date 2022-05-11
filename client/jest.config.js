// module.exports = {
// 		verbose: true,
// 		setupFilesAfterEnv: ["<rootDir>src/setupTests.ts"],
// 		moduleFileExtensions: ["js", "jsx", "ts", "tsx"],
// 		moduleDirectories: ["node_modules", "src"],
// 		moduleNameMapper: {
// 				"\\.(css|less|scss)$": "identity-obj-proxy"
// 		},
// 		transform: {
// 				'^.+\\.(ts|tsx)?$': 'ts-jest',
// 				"^.+\\.(js|jsx)$": "babel-jest",
// 				"\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/__mocks__/file.js",
// 		}
// };


// module.exports = {
// 		verbose: false,
// 		setupFilesAfterEnv: ["<rootDir>src/setupTests.ts"],
// 		moduleFileExtensions: ["js", "jsx", "ts", "tsx"],
// 		moduleDirectories: ["node_modules", "src"],
// 		moduleNameMapper: {
// 				"\\.(css|less|scss)$": "identity-obj-proxy"
// 		},
// 		transform: {
// 				'^.+\\.(ts|tsx)?$': 'ts-jest',
// 				"^.+\\.(js|jsx)$": "babel-jest",
// 		},

// 		moduleNameMapper: {
// 				'^.+\\.(s?css|less|jpg|png|svg)$': 'identity-obj-proxy',
// 		},

// 		// REQUIRED TO PROCESS STUFFS W window.
// 		testEnvironment: 'jest-environment-jsdom',

// };

module.exports = {
		preset: 'ts-jest',
		roots: ['<rootDir>/src'],
		moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
		transform: {
				'^.+\\.(ts|tsx)?$': 'ts-jest',
				"^.+\\.(js|jsx)$": "babel-jest",
		},
		setupFiles: ['raf/polyfill'],
		testRegex: '/__tests__/.*\\.(ts|tsx|js)$',
		moduleNameMapper: {
				'^.+\\.(s?css|less|jpg|png|svg)$': 'identity-obj-proxy',
				// "monaco-editor": "<rootDir>/node_modules/react-monaco-editor"
		},
		setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
		snapshotSerializers: [],
		// REQUIRED TO PROCESS STUFFS W window.
		testEnvironment: 'jest-environment-jsdom',

		// transformIgnorePatterns: [
		//  		"node_modules/(?!react-monaco-editor/.*)",
		// 		"node_modules\/(?!(monaco-editor)\/)"
		// ]

		// //LEFFEUR A CHANGE DE CAMP!
		// transformIgnorePatterns: [
		// 		"node_modules/(?!react-monaco-editor/.*)",
    // ]

		// // apparently normal behaviro
		// transformIgnorePatterns: [
		// 		"node_modules"
    // ]

		// transformIgnorePatterns: [
		// 		"/node_modules/(?!(@vscode)/).*/"
    // ]

		// //LEFFEUR A CHANGE DE CAMP!
		// transformIgnorePatterns: [
		// 		"node_modules/(?!react-monaco-editor/.*)",
    // ]


 		//moduleDirectories: ["node_modules", "src"],

		// transformIgnorePatterns: [
		// 		"<rootDir>/(node_modules)/"
		// ]

		// testPathIgnorePatterns: [
		// 		"<rootDir>/(build|config|node_modules)/"
		// ]

		// haste: {
		// 		"providesModuleNodeModules": [".*"]
		// }

};


// /*

// 	npm install --save-dev @testing-library/react


// 	=============== 

// 	1.
// 	npm install --save-dev  raf jest ts-jest @types/jest enzyme  @types/enzyme 


// 	2.
// 	// src/setupTests.ts
// 	import * as Enzyme from 'enzyme'
// 	import * as Adapter from 'enzyme-adapter-react-16'

// 	Enzyme.configure({
// 	adapter: new Adapter(),
// 	})

// */
