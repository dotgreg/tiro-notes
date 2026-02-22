import cryptico from 'cryptico'
import { extractDocumentation } from './apiDocumentation.manager'

const password:{value:string|null} = {value: null}

interface encryptionAnswer {status: string, cipher?:string, plaintext?:string}

export interface iEncryptApi {
    encryptText: (text:string, password:string) => encryptionAnswer,
    decryptText: (text:string, password:string) => encryptionAnswer

    encryptUrlParam: (text:string, password:string) => encryptionAnswer
    decryptUrlParam: (text:string, password:string) => encryptionAnswer
    documentation?: () => any
}

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
    // console.error('[DECRYPT TEXT] failed to decrypt text, return original text', results)cm
    return results
}

const encryptUrlParam:iEncryptApi['encryptUrlParam'] = (text, password) => {
    let res = encryptText(text,password)
    if (res.cipher) res.cipher = encodeURIComponent(res.cipher)
    return res
}
const decryptUrlParam:iEncryptApi['decryptUrlParam'] = (text, password) => {
    text = decodeURIComponent(text)
    let res = decryptText(text,password)
    return res
}

const encryptionApiInt: iEncryptApi = {
    encryptText,
    decryptText,
    encryptUrlParam,
    decryptUrlParam
}
encryptionApiInt.documentation = () => extractDocumentation(encryptionApiInt, 'api.encryption', 'client/src/managers/encryption.manager.ts')
export const encryptApi:iEncryptApi = encryptionApiInt




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