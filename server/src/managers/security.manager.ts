import { fileLogWrite } from "./log.manager"

// https://whatismyipaddress.com/ip/178.16.171.170
export const getSocketClientInfos = (socket:any) => {
    // console.log(socket?.raw.handshake.headers)
    // return socket?.raw?.remoteAddress || -1
    // return -1
    return JSON.stringify(socket?.raw.handshake.headers)
}

const securityLog = (str:string) => {
    console.log("[SECLOG]", new Date(), str)
    fileLogWrite(`${str}`, "security",)
}

export const security = {
    log: securityLog
}