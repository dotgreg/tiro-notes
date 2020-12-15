type KeyName = 'up' | 'down'

export const onKey = (e:any, keyName:KeyName, action:Function) => {
    e = e || window.event;
    let codes:{[key in KeyName]:number} = {
        up: 38,
        down: 40,
    }
    if (e.keyCode === codes[keyName]) {
        action()
    }
}

// function checkKey(e) {

//     e = e || window.event;

//     if (e.keyCode == '38') {
//         // up arrow
//     }
//     else if (e.keyCode == '40') {
//         // down arrow
//     }
//     else if (e.keyCode == '37') {
//        // left arrow
//     }
//     else if (e.keyCode == '39') {
//        // right arrow
//     }
