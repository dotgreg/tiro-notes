type KeyName = 'up' | 'down' | 'ctrl' | 'shift' | 'alt'

export const onKey = (e:any, keyName:KeyName, action:Function) => {
    e = e || window.event;
    let codes:{[key in KeyName]:number} = {
        up: 38,
        down: 40,
        ctrl: 17,
        shift: 16,
        alt: 18,
    }
    if (e.keyCode === codes[keyName]) {
        action()
    }
}


// export const initKeysLogic = 