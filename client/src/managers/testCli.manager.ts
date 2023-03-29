//
// Testing Fn Live
//
const windowNS = "tiroTestCli"
export const testCliAddFn = (cat: string, name:string, fn:Function) => {
    console.log("[TIRO TEST CLI] adding ", cat, name)
    //@ts-ignore
    if (!window[windowNS]) window[windowNS] = {}
    //@ts-ignore
    if (!window[windowNS][cat]) window[windowNS][cat] = {}
    //@ts-ignore
    window[windowNS][cat][name] = fn
}
export const testCliGetFn = (cat: string, name:string):Function => {
   //@ts-ignore
   return (window[windowNS] && window[windowNS][cat] && window[windowNS][cat][name]) ? window[windowNS][cat][name] : () => {console.log("TEST FN", cat, name, "does not exists")}
}