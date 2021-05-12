type KeyName = 'up' | 'down' | 'ctrl' | 'shift' | 'alt' | 'enter'
type KeyAlpha = 'a' |'b' |'c' |'d' |'e' |'f' |'g' |'h' |'i' |'j' |'k' |'l' |'m' |'n' |'o' |'p' |'q' |'r' |'s' |'t' |'u' |'v' |'w' |'x' |'y' |'z'
type KeyNumbers = '1' |'2' |'3' |'4' |'5'|'6'|'7'|'8'|'9'|'0'  
type KeySpecial = '!' |'@' |'#' |'$' |'%'|'^'|'*'|'8'|'9'|'0'  

export const onKey = (e:any, keyName:KeyName | KeyAlpha | KeyNumbers | KeySpecial, action:Function) => {
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
    } else if (e.key === keyName) {
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