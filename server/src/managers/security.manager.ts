import { fileLogWrite } from "./log.manager"

// https://whatismyipaddress.com/ip/178.16.171.170
type iClientInfosFormat = "full"|"small"|"obj"
export type iClientInfosObj = {
    ip:string, url:string,lang:string, ua:string
}
export const getSocketClientInfos = (socket:any, format: iClientInfosFormat)=> {
    return formatHeader(socket?.raw.handshake.headers, format)
}
export const formatHeader = (headers:any, format: iClientInfosFormat ):string|iClientInfosObj => {
    let full = headers
    let res:any = full
    if (format === "small") {
        res = [
            full["x-real-ip"], 
            full["host"], 
            full["accept-language"],
            full["user-agent"]
        ]
        res = JSON.stringify(res)
    } else if (format === "full") {
        res = JSON.stringify(res)
    } else if (format === "obj") {
        res = {
            ip: full["x-real-ip"], 
            url: full["host"], 
            lang: full["accept-language"],
            ua: full["user-agent"]
        }
    }
    return res
}

const securityLog = (str:string) => {
    console.log("[CRIT][SECLOG]", new Date(), str)
    fileLogWrite(`${str}`, "security",)
}

export const security = {
    log: securityLog
}