import cryptico from 'cryptico'
import { extractDocumentation } from './apiDocumentation.manager'
import { filterMetaFromFileContent } from './headerMetas.manager'

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

// cryptico derives the key deterministically from the password, but generateRSAKey() is a
// Miller-Rabin prime search: ~750ms of blocking CPU per call. Cache it, generate once.
const keyCache: {[password:string]: any} = {}
const getKey = (password:string) => keyCache[password] || (keyCache[password] = cryptico.generateRSAKey(password, Bits))

export const encryptText = (text:string, password:string):encryptionAnswer => {
    var privateKey = getKey(password);
    var publicKey = cryptico.publicKeyString(privateKey); 
    let results = cryptico.encrypt(text, publicKey) as encryptionAnswer
    // if (results.cipher) return results.cipher
    // console.error('[ENCRYPT TEXT] failed to encrypt text, return original text', results)
    return results
}

export const decryptText = (text:string, password:string):encryptionAnswer => {
    var privateKey = getKey(password);
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
    
    // strip header if present, so we only check the body
    // this prevents false negatives when the file has a metadata header
    const content = filterMetaFromFileContent(text).content
    
    const ratios = {
        nb: createRatio(/[^0-9]/g, content), 
        up: createRatio(/[^A-Z]/g, content), 
        low: createRatio(/[^a-z]/g, content),
        spe: createRatio(/[^\/\=\?\+]/g, content),
    }
    const hasGoodRatio = goodRatio(ratios.nb) && goodRatio(ratios.up) && goodRatio(ratios.low) && ratios.spe > 0

    const endsUpByEqual = content.trim().endsWith('==') || content.trim().endsWith('=')

    const format = /^[a-zA-Z0-9\/\=\?\+]+$/
    const hasNoSpecialChars = format.test(content)

    const isLongEnough = content.length > 100
        
    // console.log({...ratios, hasGoodRatio, isLongEnough, hasNoSpecialChars, endsUpByEqual});
    if (hasNoSpecialChars && hasGoodRatio && isLongEnough) res = true
    
    return res
}