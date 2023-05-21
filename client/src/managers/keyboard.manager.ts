import * as k from 'keyboardjs';

export const addKeyShortcut = (shortcut:string, Fn:Function) => {
    k.bind(shortcut, Fn);
}

export const releaseKeyShortcuts = () => {
    k.releaseAllKeys();
}