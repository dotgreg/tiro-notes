export const textToId = (raw:string):string => {
    let res = raw
    res = res.replaceAll('-','')
    res = res.replaceAll('_','')
    res = res.replaceAll(' ','')
    res = res.replaceAll('/','')
    res = res.replaceAll('.md','')
    res = res.toLowerCase()
    return res
}