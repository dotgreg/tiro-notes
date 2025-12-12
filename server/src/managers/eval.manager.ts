import { getBackendApi } from "./backendApi.manager"

export type iAnswerBackendEval = {
	status:"success"|"error"
	result?: any
    source: string
    p: any
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

        // if cb does not exists in code
        if (!codeTxt.includes("cb")) {
            return cb({status:"error", result:"NO CB function IN CODE", source: codeTxt, p:{paramsNames}})
        }

        // add async capabilities
        let codeAsyncWithTryCatch = `(async () => {
            try {
                ${codeTxt}
            } catch (e) {
                // console.log("wooooop", e)
                cb(e.message);
            }
        })();`;
        let wrapperCb = (evalCbRes:any) => {
            if (cb) {
                let finalRes = { status: "success", result: evalCbRes, source: codeTxt, p:{paramsNames, paramsValues} } as iAnswerBackendEval
                cb(finalRes)
            }
        } 
        let paramsValues = [getBackendApi, fnParamsObj, wrapperCb]
        new Function(...paramsNames, codeAsyncWithTryCatch)(...paramsValues)
    } catch (e) {
        let message = `[ERR remote code] (backend eval): ${e} (more infos in backend console),\n for => ${codeTxt}\n\n`
        if (cb) cb({ status: "error", result: message, source: codeTxt, p:{paramsNames} })
    }
}