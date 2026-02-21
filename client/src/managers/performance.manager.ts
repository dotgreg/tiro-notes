import { cloneDeep } from "lodash-es";
import { getCookie, setCookie } from "./cookie.manager";
import { devCliAddFn } from "./devCli.manager";

const h = `[FRONT PERF]`
let perfMeasureModeFront = {value: false}

const atInitRemoveConsole = () => {
	let isLogEnabled = getCookie("tiroConsoleLogEnabled") === "true"
	if (isLogEnabled) return
	console.error("==============================================================================")
	console.error("!!! console.log is disabled, to enable it again, tiroDevCli.log.toggle_enable() [you can acces frontend api by typing 'api']")
	console.error("==============================================================================")
	//@ts-ignore
	window.console = {
		warn:() => {},
		error:() => {},
		info:() => {},
		log:() => {}
	}
}
atInitRemoveConsole()

devCliAddFn("log", "toggle_enable", () => {
	let isLogEnabled = getCookie("tiroConsoleLogEnabled") === "true"
	setCookie("tiroConsoleLogEnabled", isLogEnabled ? "false" : "true", 24 * 30)
	window.location.reload()
})

devCliAddFn("performance", "toggle_monitoring", () => {
	perfMeasureModeFront.value = !perfMeasureModeFront.value
	console.log(h, `toggled to ${perfMeasureModeFront.value}`)
})

let pDic = {}
export const perf = (id:string) => {
	if (!perfMeasureModeFront.value) return () => {}
	if (!pDic[id]) pDic[id] = []
	pDic[id][0] = performance.now();
    const end = () => {
		pDic[id][1] = performance.now();
		let a = pDic[id]
		let diff = a[1] - a[0]
		console.warn(h, `${id} = ${diff} ms`, a);
    }
    return end
}


// export const pe1 = (id) => {
// 	if (!pDic[id]) pDic[id] = []
// 	pDic[id][0] = performance.now();
// }
// export const pe2 = (id) => {
// 	pDic[id][1] = performance.now();
// 	let a = pDic[id]
// 	let diff = a[1] - a[0]
// 	console.error(`[PERFORMANCE] ${id} = ${diff} ms`, a);
// 	// return performance.now();
// }

