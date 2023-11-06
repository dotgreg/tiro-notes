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


export function simpleTextDiff(text1:string, text2:string):string {
    let lines1 = text1.split('\n');
    let lines2 = text2.split('\n');
    let maxLength = Math.max(lines1.length, lines2.length);
    let result:string[] = [];

    for (let i = 0; i < maxLength; i++) {
        if (lines1[i] !== undefined && lines2[i] !== undefined) {
            if (lines1[i] !== lines2[i]) {
                result.push('<span class="diff-sign diff-modified">~~~</span> ' + lines2[i]);
            } else {
                result.push(lines2[i]);
            }
        } else if (lines1[i] !== undefined && lines2[i] === undefined) {
            result.push('<span class="diff-sign diff-deleted">---</span> ' + lines1[i]);
        } else if (lines1[i] === undefined && lines2[i] !== undefined) {
            result.push('<span class="diff-sign diff-added">+++</span> ' + lines2[i]);
        }
    }

    return result.join('\n');
}