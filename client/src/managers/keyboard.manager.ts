import * as k from 'keyboardjs';

export const addKeyShortcut = (shortcut: string, Fn: Function) => {
	if (!k || !k.bind) return
	k.bind(shortcut, Fn);
}

export const releaseKeyShortcuts = () => {
	if (!k || !k.bind) return
	k.releaseAllKeys();
}
