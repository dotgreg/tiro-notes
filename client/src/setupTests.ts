// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
// import '@testing-library/jest-dom';

// jsdom has no WebCrypto/TextEncoder: give the tests the node implementations
const util = require('util')
if (typeof (global as any).TextEncoder === 'undefined') {
	// babel downlevels classes: wrap in a real class expression, not a bare reference
	const TE: any = util.TextEncoder
	const TD: any = util.TextDecoder
	// babel cannot downlevel `class extends NativeClass`, so wrap in a plain constructor function
	;(global as any).TextEncoder = function TextEncoder(this: any, ...args: any[]) { return new TE(...args) }
	;(global as any).TextDecoder = function TextDecoder(this: any, ...args: any[]) { return new TD(...args) }
}

const { webcrypto } = require('crypto')
if (!(global as any).crypto?.subtle) {
	Object.defineProperty(global, 'crypto', { value: webcrypto, configurable: true, writable: true })
}
export { }
