import cryptico from 'cryptico'

const password:{value:string|null} = {value: null}

interface encryptionAnswer {status: string, cipher?:string, plaintext?:string}

var Bits = 1024; 
export const encryptText = (text:string, password:string):encryptionAnswer => {
    var privateKey = cryptico.generateRSAKey(password, Bits);
    var publicKey = cryptico.publicKeyString(privateKey); 
    let results = cryptico.encrypt(text, publicKey) as encryptionAnswer
    // if (results.cipher) return results.cipher
    // console.error('[ENCRYPT TEXT] failed to encrypt text, return original text', results)
    return results
}

export const decryptText = (text:string, password:string):encryptionAnswer => {
    var privateKey = cryptico.generateRSAKey(password, Bits);
    let results = cryptico.decrypt(text, privateKey) as encryptionAnswer;
    // if (results.plaintext) return results.plaintext
    // console.error('[DECRYPT TEXT] failed to decrypt text, return original text', results)
    return results
}



const createRatio = (pattern, text) => {
    const nb = text.replace(pattern, "").length
    const tot = text.length
    return Math.round((nb / tot)*100)/100
}
const goodRatio = (nb:number) => nb > 0 && nb <= 0.9
export const isTextEncrypted = (text:string):boolean => {
    let res = false
    
    const ratios = {
        nb: createRatio(/[^0-9]/g, text), 
        up: createRatio(/[^A-Z]/g, text), 
        low: createRatio(/[^a-z]/g, text),
        spe: createRatio(/[^\/\=\?\+]/g, text),
    }
    const hasGoodRatio = goodRatio(ratios.nb) && goodRatio(ratios.up) && goodRatio(ratios.low) && ratios.spe > 0

    const endsUpByEqual = text.trim().endsWith('==') || text.trim().endsWith('=')

    const format = /^[a-zA-Z0-9\/\=\?\+]+$/
    const hasNoSpecialChars = format.test(text)

    const isLongEnough = text.length > 100
        
    // console.log({...ratios, hasGoodRatio, isLongEnough, hasNoSpecialChars, endsUpByEqual});
    if (hasNoSpecialChars && hasGoodRatio && isLongEnough) res = true
    
    return res
}