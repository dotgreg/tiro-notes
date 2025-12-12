import { getBackendApi } from "./backendApi.manager"

export type iAnswerBackendEval = {
	status:"success"|"error"
	result?: any
    source: string
    params: any
}

export const evalBackendCode = (
    codeTxt:string, 
    fnParamsObj:any, 
    cb?:(answer:iAnswerBackendEval) => void
) => {
    let paramsNames = ["getBackendApi", "params", "cb"]
    try {
        //
        // EVAL RES is cb for async processes
        //
        let wrapperCb = (evalCbRes:any) => {
            if (cb) {
                let finalRes = { status: "success", result: evalCbRes, source: codeTxt, params:{paramsNames, paramsValues} } as iAnswerBackendEval
                // console.log(">> eval cb result", finalRes, "for ")
                cb(finalRes)
            }
        } 
        let paramsValues = [getBackendApi, fnParamsObj, wrapperCb]
        new Function(...paramsNames, codeTxt)(...paramsValues)
    } catch (e) {
        let message = `[ERR remote code] (backend eval): ${e} (more infos in backend console),\n for => ${codeTxt}\n\n`
        // console.log(message, e)
        if (cb) cb({ status: "error", result: message, source: codeTxt, params:{paramsNames} })
    }
}