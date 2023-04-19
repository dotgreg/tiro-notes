export const textToId = (raw:string):string => {
    let res = raw
    res =  replaceAll(res, [['-',''],['_',''],[' ',''],['/',''],['.md',''],[':',''],['?','']])
    res = res.toLowerCase()
    return res
}

export const safeString = (str:string, separator="_"):string => {
  let s = separator
    str = replaceAll(str, [['-',s],['_',s],[' ',s],['/',s]])
    return str.replace(/[^\w\s]/gi, '')
  }

  type ReplConfig = [str:string, str2:string][]
  export const replaceAll = (str:string, config:ReplConfig):string => {
    for (let i = 0; i < config.length; i++) {
        const replAction = config[i];
        str = str.split(replAction[0]).join(replAction[1])
    }
    return str
  }
