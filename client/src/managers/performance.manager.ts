import { getApi } from "../hooks/api/api.hook";
import { devCliAddFn } from "./devCli.manager";


//@ts-ignore
window.perfsDic = {}

let pDic = {}
const h = `[PERFS]`

export const pe1 = (id) => {
	if (!pDic[id]) pDic[id] = []
	pDic[id][0] = performance.now();
}
export const pe2 = (id) => {
	pDic[id][1] = performance.now();
	let a = pDic[id]
	let diff = a[1] - a[0]
	console.error(`[PERFORMANCE] ${id} = ${diff} ms`, a);
	// return performance.now();
}
