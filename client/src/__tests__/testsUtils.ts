
const equalObj = (o1: any, o2: any) => {
	const jo1 = JSON.stringify(o1)
	const jo2 = JSON.stringify(o2)
	//console.log('equalObj', jo1, jo2);
	return jo1 === jo2
}
const timeout = (ms: number) => {
	return new Promise(resolve => setTimeout(resolve, ms));
}


export const testsUtils = {
		equalObj,
		timeout
}
export const tu = testsUtils

test('nothing', () => { expect(1).toEqual(1); });
