import { each } from "lodash-es"
import { notifLog } from "./devCli.manager"

// CODE EVAL
type iFuncParams = {
    [key: string]: any
}
export const evalCode = (codeTxt:string, funcParams:iFuncParams, cb:Function) => {
    const paramsNames:string[] = []
    const paramsValues:any[] = []
    // add cb to funParams
    funcParams.cb = cb
    each(funcParams, (value, name) => {
        paramsNames.push(name)
        paramsValues.push(value)
    })
    try {
        // let res = new Function(...paramsNames, codeTxt)(...paramsValues)
        // cb && cb(res)
        new Function(...paramsNames, codeTxt)(...paramsValues)
    } catch (e) {
        let message = `[ERR eval code] (): ${e} <br> codeTxt: ${codeTxt} (more infos in console)`
        console.log(message, e, {paramsNames, paramsValues});
        console.trace(e)
        notifLog(`${message}`)
    }
}