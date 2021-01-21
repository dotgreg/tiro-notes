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