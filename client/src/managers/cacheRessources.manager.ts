import { cache } from "@emotion/css"
import { getApi } from "../hooks/api/api.hook"
import { devCliAddFn, notifLog } from "./devCli.manager"


export const ressCacheIdSync = {curr: -1}
let int = setInterval(() => {
    getRessourcesCacheId()
    if (ressCacheIdSync.curr !== -1) clearInterval(int)
}, 1000)

export const incrementRessourcesCacheId = (cb?:Function) => {
    getApi(api => {
        api.cache.get("cacheId", res => {
            let cacheId = res || 0
            api.cache.set("cacheId", cacheId + 1, -1, () => {
                ressCacheIdSync.curr = cacheId + 1
                console.log("cacheId incremented to "+ cacheId + 1  )
                if (cb) cb(ressCacheIdSync.curr)
            })
        })
    })
}

export const getRessourcesCacheId = (cb?:Function) => {
    getApi(api => {
        api.cache.get("cacheId", res => {
            let cacheId = res || 0
            ressCacheIdSync.curr = cacheId
            if(cb) cb(cacheId)
        })
    })
}
