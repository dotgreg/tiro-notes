import { notifLog } from "./devCli.manager"

export const tryCatch = (fn:Function) => {
    try {
        fn()
    } catch (error) {
        notifLog(`${error}`)
    }
}