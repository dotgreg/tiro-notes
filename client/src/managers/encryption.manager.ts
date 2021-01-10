import cryptico from 'cryptico'

const password:{value:string|null} = {value: null}

var Bits = 1024; 
export const encryptText = (text:string, password:string):string => {
    var privateKey = cryptico.generateRSAKey(password, Bits);
    var publicKey = cryptico.publicKeyString(privateKey); 
    let results = cryptico.encrypt(text, publicKey)
    if (results.cipher) return results.cipher
    console.error('[ENCRYPT TEXT] failed to encrypt text, return original text')
    return text
}

export const decryptText = (text:string, password:string):string => {
    var privateKey = cryptico.generateRSAKey(password, Bits);
    let results = cryptico.decrypt(text, privateKey);
    if (results.plaintext) return results.plaintext
    console.error('[DECRYPT TEXT] failed to decrypt text, return original text')
    return text
}