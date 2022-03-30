import { each, isNull, random } from "lodash"

type iKeyModif = 'ctrl' | 'shift' | 'alt' | 'opt'
type iKeySpecial = 'up' | 'down' | 'enter'
type iKeyAlpha = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z'
type iKeyNumbers = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '0'
type iKey = iKeySpecial | iKeyAlpha | iKeyNumbers | iKeyModif

// export const onKey = (e: any, keyName: iKey, action: Function) => {
// 	e = e || window.event;
// 	//console.log(111, e)
// 	let codes: { [key in KeyName]: number } = {
// 		up: 38,
// 		down: 40,
// 		ctrl: 17,
// 		shift: 16,
// 		alt: 18,
// 		opt: 93,
// 		enter: 13,
// 	}
// 	if (e.keyCode === codes[keyName]) {
// 		action()
// 	} else if (e.key === keyName) {
// 		action()
// 	}
// }

// NEW SYSTEM 

const modifs = {
	ctrl: false,
	shift: false,
	alt: false,
	opt: false
};

export const getKeyModif = (modifName: iKeyModif): boolean => {
	const res = modifs[modifName];
	console.log(123123, res);
	return res
}

const code2Special: { [nb: number]: iKeySpecial | iKeyModif } = {
	38: 'up',
	40: 'down',
	17: 'ctrl',
	16: 'shift',
	18: 'alt',
	93: 'opt',
	13: 'enter',
}

export const getEventKeyName = (e: any): string => {
	e = e || window.event;
	if (code2Special[e.keyCode]) return code2Special[e.keyCode]
	return e.key
}

export const startListeningToKeys = () => {
	window.onkeydown = (e: any) => {
		const keyName = getEventKeyName(e)
		if (!isNull(modifs[keyName])) modifs[keyName] = true
		const actionName = `${keyName}-down`;
		if (allKeyActions[actionName]) allKeyActions[actionName]();
		//console.log(123123, actionName, modifs, modifs[keyName]);
	}
	window.onkeyup = (e: any) => {
		const keyName = getEventKeyName(e)
		if (!isNull(modifs[keyName])) modifs[keyName] = false
		const actionName = `${keyName}-up`;
		if (allKeyActions[actionName]) allKeyActions[actionName]();
		//console.log(123123, actionName, modifs, modifs[keyName]);
	}
	console.log('[KEY] 123123 startListeningToKeys');
}

const allKeyActions: { [keyAndState: string]: Function } = {}

export const addKeyAction = (keyName: iKey, action: Function, pressState: 'up' | 'down' = 'down') => {
	allKeyActions[`${keyName}-${pressState}`] = action
}



