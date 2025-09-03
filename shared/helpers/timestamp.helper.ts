export const toTimeStampInS = (timestamp:number|string) => {
    const timestampInString = `${timestamp}`
    // let resStr = timestampInString.substr(0, 10)
    // only keep 10 first chars
    let resStr = timestampInString.substring(0, 10)
    let res = parseInt(resStr)
    return res
}

export const isTimestamp = (string:string) => parseInt(string).toString() === string