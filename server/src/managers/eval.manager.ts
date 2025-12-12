import { getBackendApi } from "./backendApi.manager"

export type iAnswerBackendEval = {
	status:"success"|"error",
	result?: any,
}

export const evalBackendCode = (codeTxt:string, fnParamsObj:any, cb?:(answer:iAnswerBackendEval) => void) => {
    try {
        let paramsNames = ["getBackendApi", "params", "cb"]
        let wrapperCb = (evalCbRes:any) => {
            if (cb) cb({ status: "success", result: evalCbRes })
        } 
        let paramsValues = [getBackendApi, fnParamsObj, wrapperCb]
        console.log('[backend eval] =>>', codeTxt)
        new Function(...paramsNames, codeTxt)(...paramsValues)
        
        // return { status: "success", result: res }
    } catch (e) {
        let message = `[ERR remote code] (backend eval): ${e} (more infos in backend console)`
        console.log(message, e)
        if (cb) cb({ status: "error", result: message })
        // return { status: "error", result: message }
    }
}