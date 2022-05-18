
type ApiCalls =
	'file.getContent' |
	'files.getContent' |
	'woop.geti' |
	'woop.iiwo' |
	'ifldsakl.fdsla'


/**
 * Returns the average of two numbers.
 *
 * @remarks
 * This method is part of the {@link core-library#Statistics | Statistics subsystem}.
 *
 * @param nameApi- The first input woop
 *           - file.getContent
 *           - file.getContent
 *           - file.getContent
 *           - file.getContent
 *           - file.getContent
 *           - file.getContent
 * @param x - The first input number
 * @param x - The first input number
 * @param x - The first input number
 * @param x - The first input number
 * @param x - The first input number
 * @param x - The first input number
 * @param x - The first input number
 * @param y - The second input number
 * @returns The arithmetic mean of `x` and `y`
 *
 * @beta
 */
export function call(nameApi: ApiCalls, y: number): void { // 
	return 
}

/**
 * Returns the average of two numbers.
 *
 * @remarks
 * This method is part of the {@link core-library#Statistics | Statistics subsystem}.
 *
 * @param x - The first input number
 * @param y - The second input number
 * @returns The arithmetic mean of `x` and `y`
 *
 * @beta
 */
export function getAverage(x: number, y: number): number {
	return (x + y) / 2.0;
}

// The TypeScript function is included for illustrative purposes.
// It is not processed by the TSDoc parser.

// export const api = {

// 	version: "1.0",
// 	utils: {
// 		call,
// 		getAverage
// 	}

// }
