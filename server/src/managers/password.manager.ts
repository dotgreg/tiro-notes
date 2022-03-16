import { log } from "./log.manager"

const crypto = require("crypto")

let isAuthorized:boolean = false
// let timeToAuth = 1000 * 60 * 60 * 2
let timeToAuth = 1000 * 60

export const staticServerAuthLogic = (username, userPassword, cb) => {
    let pass = 'a17967826adf5aa8b0d7d435b9900ee5:3cccf3683d4ce3823b9e70cec998a9567cbb7756d434eef8f223964451b1e60e8cb4e700ae8fed815b9c4df2e9522ab3513f694e97dd340450616358745ef23f'
    let userMatches = (username === new Date().getHours().toString()) ? true : false
    // log(`staticServerAuthLogic`);
    
    if (isAuthorized) {
        log(`[AUTH] still isAuthorized`);
        
        return cb(null, true)
    } else {
        verifyPassword(userPassword, pass).then((passwordMatches) => {
            let res = passwordMatches && userMatches
            if (res) {
                isAuthorized = true 
                log(`[AUTH] isAuthorized to true for ${timeToAuth/(1000*60)}m`);
                setTimeout(()=>{
                    log(`[AUTH] isAuthorized expired`);
                    isAuthorized = false 
                }, timeToAuth )
            }
            return cb(null, res)
        })
    }
}

export const hashPassword = async (password):Promise<string> => {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16).toString("hex")
        crypto.scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) reject(err);
            resolve(salt + ":" + derivedKey.toString('hex'))
        });
    })
}

export const verifyPassword = (password, hash):Promise<boolean> => {
    return new Promise((resolve, reject) => {
        const [salt, key] = hash.split(":")
        crypto.scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) reject(err);
            resolve(key == derivedKey.toString('hex'))
        });
    })
}
