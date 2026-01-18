export const textToId = (raw:string):string => {
    let res = raw
    res =  replaceAll(res, [['-',''],['_',''],[' ',''],['/',''],['.md',''],[':',''],['?','']])
    res = res.toLowerCase()
    return res
}

type iOptsSimplifyStr = {
    accents:boolean,
    specialChars:boolean,
    escapeChars:boolean
}
export const transformString = (str:string, opts?:iOptsSimplifyStr):string => {
    if (!opts) opts = { accents: true, specialChars: true, escapeChars: true}
    if (!opts.accents) opts.accents = true
    if (!opts.specialChars) opts.specialChars = true
    if (!opts.escapeChars) opts.escapeChars = true

  // add a js function that simplifies all accents and special chars to return only a-Z0-9 + simple punctuation, ie capacité = capacite
    // how to keep linejumps like \\n 
    function normalizeTextNoAccents(text) {
        if (!text) return '';

        // Step 1: Convert accented characters to base form
        const normalized = text.normalize('NFD')

        // Step 2: Keep only allowed characters and convert to lowercase
        return normalized
            
        //.replace(/\s+/g, ' '); // Replace spaces with underscores
    }


    function simplifySpecialChars(text) {
        const normalized = text.normalize("NFKD");
        const replacements = {
            "œ": "oe", "Œ": "OE",
            "æ": "ae", "Æ": "AE",
            "–": "-", "—": "-",
            "…": "...",
            "‘": "'", "’": "'",
            "“": '"', "”": '"',
            "«": '"', "»": '"',
            " ": " "
        };
        const simplified = normalized.replace(
            /[œŒæÆ–—…‘’“”«» ]/g,
            (match) => replacements[match] || match
        );
        return simplified.normalize("NFC");
    }

    if(!opts.specialChars)str = simplifySpecialChars(str);
    if(!opts.accents) str = normalizeTextNoAccents(str);
    str = str.replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
        .replace(/[’‘`]/g, "'")          // Standardize apostrophes
        .replace(/["“”]/g, "'")          // Standardize quotes
        .replace(/[«»]/g, "'")          // Standardize quotes
        .replace(/[–—]/g, '-')          // Standardize dashes
        .replace(/'/g, "’")
        .replace(/"/g, "’")

    if (opts.escapeChars) {
        // escape " and ' for command line usage
        str = str.replace(/"/g, '\\"').replace(/'/g, "\\'");
    }

    return str
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