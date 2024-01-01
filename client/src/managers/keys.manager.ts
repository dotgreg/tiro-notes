import { each, isNull, random } from "lodash"

//
// !!!!!!!!!! NEW METHOD addKeyShortcut > keyboard.manager.ts
//

type iKeyModif = 'ctrl' | 'shift' | 'alt' | 'opt'
type iKeySpecial = 'up' | 'down' | 'enter'
type iKeyAlpha = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z'
type iKeyNumbers = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '0'
type iKey = iKeySpecial | iKeyAlpha | iKeyNumbers | iKeyModif

// NEW SYSTEM 

export const keysModifiers = {
	ctrl: false,
	shift: false,
	alt: false,
	opt: false,
	Meta: false,
};

export const getKeyModif = (modifName: iKeyModif): boolean => {
	const res = keysModifiers[modifName];
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
		if (!isNull(keysModifiers[keyName])) keysModifiers[keyName] = true
		const actionName = `${keyName}-down`;
		if (allKeyActions[actionName]) allKeyActions[actionName]();
	}
	window.onkeyup = (e: any) => {
		const keyName = getEventKeyName(e)
		if (!isNull(keysModifiers[keyName])) keysModifiers[keyName] = false
		const actionName = `${keyName}-up`;
		if (allKeyActions[actionName]) allKeyActions[actionName]();
	}
}

const allKeyActions: { [keyAndState: string]: Function } = {}

export const addKeyAction = (keyName: string, action: Function, pressState: 'up' | 'down' = 'down') => {
	allKeyActions[`${keyName}-${pressState}`] = action
}



