import { fileLogWrite } from "./log.manager"

// https://whatismyipaddress.com/ip/178.16.171.170
export const getSocketClientInfos = (socket:any, format: "full"|"small") => {
    return formatHeader(socket?.raw.handshake.headers, format)
}
export const formatHeader = (headers:any, format: "full"|"small" ) => {
    let full = headers
    let res:any = full
    if (format === "small") {
        res = [
            full["x-real-ip"], 
            full["host"], 
            full["accept-language"],
            full["user-agent"]
        ]
    }
    return JSON.stringify(res)
}

const securityLog = (str:string) => {
    console.log("[CRIT][SECLOG]", new Date(), str)
    fileLogWrite(`${str}`, "security",)
}

export const security = {
    log: securityLog
}