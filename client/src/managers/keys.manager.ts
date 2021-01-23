type KeyName = 'up' | 'down' | 'ctrl' | 'shift' | 'alt' | 'enter'

export const onKey = (e:any, keyName:KeyName, action:Function) => {
    e = e || window.event;
    let codes:{[key in KeyName]:number} = {
        up: 38,
        down: 40,
        ctrl: 17,
        shift: 16,
        alt: 18,
        enter: 13,
    }
    if (e.keyCode === codes[keyName]) {
        action()
    }
}




// export const listenOnEnter = (el:HTMLElement) => {
//     el.addEventListener('keydown', handleOnEnter)
// }
// export const stopListenOnEnter = (el:HTMLElement) => {
//     el.removeEventListener('keydown', handleOnEnter)
// }


// export const initKeysLogic = 