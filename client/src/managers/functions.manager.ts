

var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
var ARGUMENT_NAMES = /([^\s,]+)/g;
export const getFunctionParamNames = (fn: Function) => {
	var fnStr = fn.toString().replace(STRIP_COMMENTS, '');

	let result: any = null
	if (fnStr.startsWith("cb =>")) {
		result = ["cb"]
	} else {
		result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
	}

	if (result === null) result = [];
	return result;
}
