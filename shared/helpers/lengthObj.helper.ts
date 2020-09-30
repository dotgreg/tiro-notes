export const lengthObj = (obj:Object):number => {
    let nb = 0
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            nb++
        }
    }
    return nb
}