import { devCliAddFn } from "./devCli.manager";

const h = `[FRONT PERF]`
let perfModeFront = {value: false}
devCliAddFn("performance", "toggle_monitoring", () => {
	perfModeFront.value = !perfModeFront.value
	console.log(h, `toggled to ${perfModeFront.value}`)
})

let pDic = {}
export const perf = (id:string) => {
	if (!perfModeFront.value) return () => {}
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

